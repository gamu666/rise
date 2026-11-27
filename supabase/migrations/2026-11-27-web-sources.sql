-- 2026-11-27 · Where website visitors come from (owner request 2026-11-27: "эх сурвалж тоолох"). The public site sends
-- one category with each page view: facebook, instagram, google, search (another search engine), site (another
-- website) or direct (typed address, bookmark, or an app that hides where the visit came from). Only that category is
-- stored, per day and page: no address, visitor id, cookie or IP. web_daily and its counts stay exactly as they were.
-- Re-runnable. Apply before uploading the site.js that sends p_src and the manager-crm.js that calls web_source_stats.

create table if not exists public.web_source_daily (
  day date not null,
  page text not null check (page ~ '^[a-z0-9-]{1,40}$'),
  src text not null check (src in ('facebook', 'instagram', 'google', 'search', 'site', 'direct')),
  n integer not null default 0 check (n >= 0),
  primary key (day, page, src)
);
alter table public.web_source_daily enable row level security;  -- no policies: only track_web and web_source_stats use it
revoke all on public.web_source_daily from anon, authenticated;

-- track_web gains an optional third argument. The two-argument version is replaced rather than overloaded, so the API
-- has one function to call; a site.js cached from before still sends two arguments and keeps counting views.
drop function if exists public.track_web(text, text);
create or replace function public.track_web(p_event text, p_page text, p_src text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare d date := (now() at time zone 'Asia/Ulaanbaatar')::date;
begin
  if p_event is null or p_event not in ('view', 'register', 'call', 'messenger')
     or p_page is null or p_page !~ '^[a-z0-9-]{1,40}$' then
    return;  -- junk is ignored quietly
  end if;
  -- at most 40 different pages a day, so made-up page names cannot grow the tables without limit
  if not exists (select 1 from public.web_daily w where w.day = d and w.page = p_page)
     and (select count(distinct w.page) from public.web_daily w where w.day = d) >= 40 then
    return;
  end if;
  insert into public.web_daily as w (day, page, event, n) values (d, p_page, p_event, 1)
  on conflict (day, page, event) do update set n = w.n + 1;
  -- where the visit came from: page views only, and only one of the known categories
  if p_event = 'view' and p_src in ('facebook', 'instagram', 'google', 'search', 'site', 'direct') then
    insert into public.web_source_daily as s (day, page, src, n) values (d, p_page, p_src, 1)
    on conflict (day, page, src) do update set n = s.n + 1;
  end if;
end $$;
revoke execute on function public.track_web(text, text, text) from public;
grant execute on function public.track_web(text, text, text) to anon, authenticated;

-- Leaders (ахлах менежер and above) read the counts per day, page and source; counts only.
create or replace function public.web_source_stats(p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(private.me_level(), 0) < 2 then raise exception 'Статистикийг зөвхөн удирдлага харна.'; end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 800 then raise exception 'Хугацааны мужаа шалгана уу.'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('day', s.day, 'page', s.page, 'src', s.src, 'n', s.n) order by s.day, s.page, s.src)
      from public.web_source_daily s
     where s.day between p_from and p_to), '[]'::jsonb);
end $$;
revoke execute on function public.web_source_stats(date, date) from public, anon;
grant execute on function public.web_source_stats(date, date) to authenticated;
