-- 2026-11-21 · real attendance (public.attendance, public.punch). Run once in the Supabase SQL editor on a database
-- that already has schema.sql. Safe to run again. The same objects are part of schema.sql.

-- ───────────────────────────────────────── attendance (Цаг бүртгэл)
-- One row per person per Ulaanbaatar day. Times come from the server clock through punch(); nobody writes the
-- table directly. Everyone reads their own rows, leaders their branch, the general director everyone; the general
-- director does not punch (owner request 2026-11-21: they only watch the others).
create table if not exists public.attendance (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  branch_id smallint references public.branches (id),
  check_in timestamptz,
  check_out timestamptz,
  primary key (user_id, day)
);
create index if not exists attendance_branch_day_idx on public.attendance (branch_id, day);
alter table public.attendance enable row level security;
drop policy if exists attendance_read on public.attendance;
create policy attendance_read on public.attendance for select to authenticated
  using (user_id = (select auth.uid()) or private.can_see_branch(branch_id));
revoke all on public.attendance from anon;
revoke insert, update, delete, truncate on public.attendance from authenticated;

create or replace function public.punch(p_kind text) returns public.attendance
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  lvl smallint := private.me_level();
  d date := (now() at time zone 'Asia/Ulaanbaatar')::date;
  r public.attendance;
begin
  if me is null or lvl is null then raise exception 'Нэвтрээгүй байна.'; end if;
  if lvl >= 4 then raise exception 'Ерөнхий захирал цаг бүртгүүлэхгүй, бусдын ирцийг хянана.'; end if;
  if p_kind = 'in' then
    -- the first arrival of the day counts; pressing again keeps it
    insert into public.attendance (user_id, day, branch_id, check_in) values (me, d, private.me_branch(), now())
    on conflict (user_id, day) do nothing;
  elsif p_kind = 'out' then
    -- the last departure counts
    update public.attendance set check_out = now() where user_id = me and day = d and check_in is not null;
    if not found then raise exception 'Эхлээд "Би ирлээ" дарна уу.'; end if;
  else
    raise exception 'Буруу үйлдэл.';
  end if;
  select * into r from public.attendance where user_id = me and day = d;
  return r;
end $$;

-- ───────────────────────────────────────── grants for the new function
revoke execute on function public.punch(text) from public, anon;
grant execute on function public.punch(text) to authenticated;
