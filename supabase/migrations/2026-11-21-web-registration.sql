-- 2026-11-21 · Website registration without a request step (owner request 2026-11-21).
-- The visitor answers "Таныг хариуцсан менежер байгаа юу?": yes → picks that manager from the list of active managers
-- and the registration lands in the CRM (Харилцагч) already assigned to them; no → picks a branch and it waits,
-- unassigned, for that branch's managers (as web leads did before). They choose the course and build their own weekly
-- schedule (any days, own hours per day). Nobody approves a request.
-- e-Mongolia identity verification and the online contract (e-Mongolia / GSign) are not connected yet: until they are,
-- the visitor gives a name and phone number and the manager arranges the contract.
-- public.submit_web_lead stays for pages cached before this change.
-- Re-runnable. Apply before uploading the site.js that calls these functions.

-- The schedule exactly as the visitor built it: [{"d": 0–6 (Monday = 0), "from": "HH:MM", "to": "HH:MM"}, …].
-- leads.preferred_time keeps the readable form that the CRM already shows ("Да 10:00–12:00, Лх 18:00–20:30").
alter table public.leads add column if not exists schedule jsonb;
alter table public.leads drop constraint if exists leads_schedule_array;
alter table public.leads add constraint leads_schedule_array check (schedule is null or jsonb_typeof(schedule) = 'array');

-- What the form may show without sign-in: the branches, and the active managers and senior managers with their display
-- name, position and branch only (no login, phone or photo). Accounts still carrying the seeded position placeholder
-- ("Салбар 1 · Менежер 3", private.seed_accounts) are left out — a visitor cannot recognise their manager by it — and
-- appear by themselves once the person sets their real name in Профайл or the general director renames them in Данс.
create or replace function public.web_registration_options()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'branches', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name) order by b.id)
                            from public.branches b), '[]'::jsonb),
    'managers', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.display_name, 'role', p.role, 'branch', p.branch_id)
                                           order by p.branch_id, p.level desc, p.display_name)
                            from public.profiles p
                           where p.active and not p.hidden and p.role in ('manager', 'senior_manager')
                             and p.branch_id is not null and p.display_name !~ '^Салбар [0-9]+ · '), '[]'::jsonb)
  )
$$;

create or replace function public.register_web(p_name text, p_phone text, p_course text, p_manager uuid,
                                                p_branch smallint, p_schedule jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_course text := left(nullif(btrim(coalesce(p_course, '')), ''), 80);
  v_owner uuid;
  v_branch smallint;
  v_days constant text[] := array['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'];
  v_seen int[] := '{}';
  v_plan jsonb := '[]'::jsonb;
  v_text text[] := '{}';
  e jsonb; d int; f text; t text;
begin
  if char_length(btrim(coalesce(p_name, ''))) < 2 or v_phone !~ '^[0-9]{8}$' then
    raise exception 'Нэр, 8 оронтой утасны дугаараа шалгана уу.';
  end if;
  if v_course is null then raise exception 'Сургалтаа сонгоно уу.'; end if;
  if p_manager is not null then
    select p.id, p.branch_id into v_owner, v_branch from public.profiles p
     where p.id = p_manager and p.active and not p.hidden and p.role in ('manager', 'senior_manager');
    if v_owner is null then raise exception 'Сонгосон менежер олдсонгүй. Жагсаалтаас дахин сонгоно уу.'; end if;
  else
    select b.id into v_branch from public.branches b where b.id = p_branch;
    if v_branch is null then raise exception 'Суралцах салбараа сонгоно уу.'; end if;
  end if;
  if p_schedule is null or jsonb_typeof(p_schedule) <> 'array' or jsonb_array_length(p_schedule) not between 1 and 7 then
    raise exception 'Суралцах өдрөө сонгоно уу.';
  end if;
  for e in select value from jsonb_array_elements(p_schedule) order by value->>'d' loop
    d := case when e->>'d' ~ '^[0-6]$' then (e->>'d')::int end;
    f := e->>'from'; t := e->>'to';
    if d is null or d = any (v_seen)
       or coalesce(f, '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(t, '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or t <= f then
      raise exception 'Хуваарийн өдөр, цагаа шалгана уу.';
    end if;
    v_seen := v_seen || d;
    v_plan := v_plan || jsonb_build_array(jsonb_build_object('d', d, 'from', f, 'to', t));
    v_text := v_text || (v_days[d + 1] || ' ' || f || '–' || t);
  end loop;
  if (select count(*) from public.leads where phone = v_phone and created_at > now() - interval '1 day') >= 3 then
    return true;  -- already received today; do not create duplicates
  end if;
  insert into public.leads (name, phone, course, source, branch_id, owner_id, preferred_time, schedule)
  values (left(btrim(p_name), 120), v_phone, v_course, 'web', v_branch, v_owner, array_to_string(v_text, ', '), v_plan);
  return true;
end $$;

revoke execute on function public.web_registration_options() from public;
revoke execute on function public.register_web(text, text, text, uuid, smallint, jsonb) from public;
grant execute on function public.web_registration_options() to anon, authenticated;
grant execute on function public.register_web(text, text, text, uuid, smallint, jsonb) to anon, authenticated;
