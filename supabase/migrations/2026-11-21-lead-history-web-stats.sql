-- 2026-11-21 · CRM note history (lead_events) and anonymous website interest counters (web_daily, track_web).
-- Run once in the Supabase SQL editor on a database that already has schema.sql. Safe to run again.
-- The same objects are part of schema.sql; this file only carries the change.

-- ───────────────────────────────────────── lead history: staff notes plus automatic status / owner changes
-- Notes are append-only (nobody edits or deletes them), so a new note never overwrites an earlier one; leads.note
-- mirrors the latest note for list search. Status and owner changes are written by a trigger, never by the browser.
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  created_at timestamptz not null default now(),
  author_id uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('note', 'status', 'owner')),
  body text check (body is null or char_length(btrim(body)) between 1 and 2000),
  from_value text,
  to_value text
);
create index if not exists lead_events_lead_idx on public.lead_events (lead_id, created_at desc);

-- A signed-in request always gets its own id as the author and the server time; a migration run without a
-- session (SQL editor) keeps the values it gives.
create or replace function private.lead_events_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then
    new.created_at := now();
    if new.kind = 'note' then new.author_id := auth.uid(); end if;
  end if;
  if new.kind = 'note' then new.body := btrim(new.body); new.from_value := null; new.to_value := null; end if;
  return new;
end $$;

create or replace function private.lead_events_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.kind = 'note' then
    update public.leads set note = new.body where id = new.lead_id and note is distinct from new.body;
  end if;
  return null;
end $$;

drop trigger if exists lead_events_before_insert on public.lead_events;
create trigger lead_events_before_insert before insert on public.lead_events
  for each row execute function private.lead_events_before_insert();
drop trigger if exists lead_events_after_insert on public.lead_events;
create trigger lead_events_after_insert after insert on public.lead_events
  for each row execute function private.lead_events_after_insert();

create or replace function private.leads_after_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_events (lead_id, author_id, kind, from_value, to_value)
    values (new.id, auth.uid(), 'status', old.status, new.status);
  end if;
  if new.owner_id is distinct from old.owner_id then
    insert into public.lead_events (lead_id, author_id, kind, from_value, to_value)
    values (new.id, auth.uid(), 'owner', old.owner_id::text, new.owner_id::text);
  end if;
  return null;
end $$;

drop trigger if exists leads_after_update on public.leads;
create trigger leads_after_update after update on public.leads
  for each row execute function private.leads_after_update();

alter table public.lead_events enable row level security;

-- Whoever can see the lead sees its history; staff add notes only to leads they can see.
drop policy if exists lead_events_read on public.lead_events;
create policy lead_events_read on public.lead_events for select to authenticated
  using (exists (select 1 from public.leads l where l.id = lead_events.lead_id));

drop policy if exists lead_events_insert on public.lead_events;
create policy lead_events_insert on public.lead_events for insert to authenticated
  with check (kind = 'note' and (select private.me_level()) >= 1
              and exists (select 1 from public.leads l where l.id = lead_events.lead_id));

revoke all on public.lead_events from anon;
revoke update, delete, truncate on public.lead_events from authenticated;

-- ───────────────────────────────────────── website interest counters (public site → CRM statistics)
-- Anonymous daily totals per page (home or a course slug) and event. No visitor id, IP address or cookie is stored:
-- each call only adds 1 to "this page, this event, today".
create table if not exists public.web_daily (
  day date not null,
  page text not null check (page ~ '^[a-z0-9-]{1,40}$'),
  event text not null check (event in ('view', 'register', 'call', 'messenger')),
  n integer not null default 0 check (n >= 0),
  primary key (day, page, event)
);
alter table public.web_daily enable row level security;  -- no policies: only track_web and crm_stats use it
revoke all on public.web_daily from anon, authenticated;

create or replace function public.track_web(p_event text, p_page text)
returns void language plpgsql security definer set search_path = '' as $$
declare d date := (now() at time zone 'Asia/Ulaanbaatar')::date;
begin
  if p_event is null or p_event not in ('view', 'register', 'call', 'messenger')
     or p_page is null or p_page !~ '^[a-z0-9-]{1,40}$' then
    return;  -- junk is ignored quietly
  end if;
  -- at most 40 different pages a day, so made-up page names cannot grow the table without limit
  if not exists (select 1 from public.web_daily w where w.day = d and w.page = p_page)
     and (select count(distinct w.page) from public.web_daily w where w.day = d) >= 40 then
    return;
  end if;
  insert into public.web_daily as w (day, page, event, n) values (d, p_page, p_event, 1)
  on conflict (day, page, event) do update set n = w.n + 1;
end $$;

-- ───────────────────────────────────────── statistics for leaders
create or replace function public.crm_stats(p_from date, p_to date, p_branch smallint default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  lvl smallint := private.me_level();
  b smallint;
  t0 timestamptz := p_from::timestamp at time zone 'Asia/Ulaanbaatar';
  t1 timestamptz := (p_to + 1)::timestamp at time zone 'Asia/Ulaanbaatar';
  result jsonb;
begin
  if lvl is null or lvl < 2 then raise exception 'Статистикийг зөвхөн удирдлага харна.'; end if;
  if p_to < p_from or p_to - p_from > 400 then raise exception 'Хугацааны мужаа шалгана уу.'; end if;
  b := case when lvl = 4 then p_branch else private.me_branch() end;

  with scoped as (
         select l.* from public.leads l where b is null or l.branch_id = b),
       created as (select * from scoped where created_at >= t0 and created_at < t1),
       enrolled as (select * from scoped where status = 'enrolled' and enrolled_at >= t0 and enrolled_at < t1),
       people as (
         select p.id, p.display_name, p.role, p.branch_id from public.profiles p
          where p.active and not p.hidden and p.level between 1 and 2 and (b is null or p.branch_id = b))
  select jsonb_build_object(
    'branch', b,
    'from', p_from,
    'to', p_to,
    'totals', jsonb_build_object(
      'leads', (select count(*) from created),
      'enrolled', (select count(*) from enrolled),
      'revenue', (select coalesce(sum(amount), 0) from enrolled),
      'lost', (select count(*) from created where status = 'lost'),
      'open', (select count(*) from created where status in ('new', 'contacted', 'interested')),
      'uncontacted', (select count(*) from scoped where status = 'new'),
      'avg_contact_hours', (select round((avg(extract(epoch from contacted_at - created_at)) / 3600)::numeric, 1)
                              from created where contacted_at is not null)),
    'by_status', coalesce((select jsonb_object_agg(status, n) from (
        select status, count(*) n from created group by status) s), '{}'::jsonb),
    'by_source', coalesce((select jsonb_agg(jsonb_build_object('source', source, 'leads', leads, 'enrolled', enr) order by leads desc)
        from (select source, count(*) leads, count(*) filter (where status = 'enrolled') enr from created group by source) s), '[]'::jsonb),
    'by_course', coalesce((select jsonb_agg(jsonb_build_object('course', course, 'leads', leads, 'enrolled', enr, 'revenue', rev) order by leads desc)
        from (select coalesce(course, '—') course, count(*) leads,
                     count(*) filter (where status = 'enrolled') enr,
                     coalesce(sum(amount) filter (where status = 'enrolled'), 0) rev
                from created group by 1) s), '[]'::jsonb),
    'by_day', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'leads', lc, 'enrolled', ec) order by d)
        from (select g::date d,
                     (select count(*) from created c where (c.created_at at time zone 'Asia/Ulaanbaatar')::date = g::date) lc,
                     (select count(*) from enrolled e where (e.enrolled_at at time zone 'Asia/Ulaanbaatar')::date = g::date) ec
                from generate_series(p_from, p_to, interval '1 day') g) s), '[]'::jsonb),
    'by_person', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', display_name, 'role', role, 'branch', branch_id,
                                                              'leads', leads, 'enrolled', enr, 'revenue', rev)
                                            order by rev desc, enr desc, display_name)
        from (select p.id, p.display_name, p.role, p.branch_id,
                     (select count(*) from created c where c.owner_id = p.id) leads,
                     (select count(*) from enrolled e where e.owner_id = p.id) enr,
                     (select coalesce(sum(amount), 0) from enrolled e where e.owner_id = p.id) rev
                from people p) s), '[]'::jsonb),
    'by_branch', case when b is null then coalesce((select jsonb_agg(jsonb_build_object('branch', id, 'name', name,
                                                              'leads', leads, 'enrolled', enr, 'revenue', rev) order by id)
        from (select br.id, br.name,
                     (select count(*) from created c where c.branch_id = br.id) leads,
                     (select count(*) from enrolled e where e.branch_id = br.id) enr,
                     (select coalesce(sum(amount), 0) from enrolled e where e.branch_id = br.id) rev
                from public.branches br) s), '[]'::jsonb) end,
    'facebook', jsonb_build_object(
      'connected', exists (select 1 from public.integration_status where key = 'facebook' and ok),
      'status', (select jsonb_build_object('ok', ok, 'message', message, 'updated_at', updated_at)
                   from public.integration_status where key = 'facebook'),
      'followers', (select followers from public.fb_page_daily where followers is not null order by day desc limit 1),
      'new_follows', (select coalesce(sum(new_follows), 0) from public.fb_page_daily where day between p_from and p_to),
      'reach', (select coalesce(sum(reach), 0) from public.fb_page_daily where day between p_from and p_to),
      'engagements', (select coalesce(sum(engagements), 0) from public.fb_page_daily where day between p_from and p_to),
      'page_views', (select coalesce(sum(page_views), 0) from public.fb_page_daily where day between p_from and p_to),
      'days', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'reach', reach, 'engagements', engagements, 'new_follows', new_follows) order by day)
                          from public.fb_page_daily where day between p_from and p_to), '[]'::jsonb),
      'top_posts', coalesce((select jsonb_agg(row_to_json(t)::jsonb) from (
                     select id, created_at, left(message, 160) message, permalink, reactions, comments, shares
                       from public.fb_posts where created_at >= t0 and created_at < t1
                      order by reactions + comments * 2 + shares * 3 desc limit 5) t), '[]'::jsonb)),
    -- website: one site serves every branch, so these totals are company-wide (counts only, no records)
    'web', jsonb_build_object(
      'pages', coalesce((select jsonb_agg(jsonb_build_object('page', page, 'view', v, 'register', r, 'call', c, 'messenger', m)
                                          order by v desc, page)
          from (select w.page,
                       coalesce(sum(w.n) filter (where w.event = 'view'), 0) v,
                       coalesce(sum(w.n) filter (where w.event = 'register'), 0) r,
                       coalesce(sum(w.n) filter (where w.event = 'call'), 0) c,
                       coalesce(sum(w.n) filter (where w.event = 'messenger'), 0) m
                  from public.web_daily w where w.day between p_from and p_to group by w.page) s), '[]'::jsonb),
      'leads', coalesce((select jsonb_agg(jsonb_build_object('course', course, 'leads', leads, 'enrolled', enr) order by leads desc)
          from (select coalesce(l.course, '—') course, count(*) leads, count(*) filter (where l.status = 'enrolled') enr
                  from public.leads l where l.source = 'web' and l.created_at >= t0 and l.created_at < t1 group by 1) s), '[]'::jsonb))
  ) into result;
  return result;
end $$;

-- ───────────────────────────────────────── grants for the new function
revoke execute on function public.track_web(text, text) from public;
grant execute on function public.track_web(text, text) to anon, authenticated;
grant execute on function public.crm_stats(date, date, smallint) to authenticated;

-- ───────────────────────────────────────── notes written before the history existed become its first entry (author unknown, time of the last edit)
insert into public.lead_events (lead_id, created_at, author_id, kind, body)
select l.id, l.updated_at, null, 'note', l.note
  from public.leads l
 where l.note is not null and btrim(l.note) <> ''
   and not exists (select 1 from public.lead_events e where e.lead_id = l.id and e.kind = 'note');
