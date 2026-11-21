-- THE RISE · Supabase backend: accounts, tasks, unified chat, CRM leads, Facebook page statistics.
-- Run in the Supabase SQL editor (role postgres). Re-runnable: tables use IF NOT EXISTS, functions CREATE OR REPLACE,
-- policies and triggers are dropped and recreated.
--
-- Security model
--   * Browsers use the publishable key + the signed-in user's JWT. Every public table has Row Level Security.
--   * Helper and internal functions live in schema `private`, which the Data API does not expose.
--   * Accounts are created only by the general director (admin_create_account) or by postgres (private.seed_accounts).
--     Initial passwords are random, returned once, and must be changed at first sign-in.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
grant usage on schema private to authenticated;

-- ───────────────────────────────────────── branches
create table if not exists public.branches (
  id smallint primary key,
  name text not null unique
);
insert into public.branches (id, name) values (1, 'Салбар 1'), (2, 'Салбар 2'), (3, 'Салбар 3')
on conflict (id) do nothing;

-- ───────────────────────────────────────── profiles (one per auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  login text not null unique check (login ~ '^[a-z0-9][a-z0-9._-]{1,31}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  role text not null check (role in ('general_director', 'branch_director', 'senior_manager', 'manager', 'teacher')),
  level smallint generated always as (
    case role when 'general_director' then 4 when 'branch_director' then 3
              when 'senior_manager' then 2 when 'manager' then 1 else 0 end
  ) stored,
  branch_id smallint references public.branches (id),
  phone text check (phone is null or phone ~ '^[0-9+ ]{6,20}$'),
  avatar_url text,
  must_change_password boolean not null default true,
  active boolean not null default true,
  hidden boolean not null default false,          -- temporary QA accounts; never shown to staff
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_branch_required check (role = 'general_director' or branch_id is not null)
);

create or replace function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

-- ───────────────────────────────────────── helpers used by policies
create or replace function private.me_level() returns smallint
language sql stable security definer set search_path = '' as $$
  select level from public.profiles where id = auth.uid() and active
$$;

create or replace function private.me_branch() returns smallint
language sql stable security definer set search_path = '' as $$
  select branch_id from public.profiles where id = auth.uid() and active
$$;

create or replace function private.me_hidden() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select hidden from public.profiles where id = auth.uid()), false)
$$;

create or replace function private.is_gd() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and level = 4)
$$;

-- May the signed-in person assign tasks to / oversee the work of `target`?
-- General director: everyone. Branch director and senior manager: lower ranks in their own branch.
create or replace function private.can_assign(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles me join public.profiles t on t.id = target
    where me.id = auth.uid() and me.active and t.active
      and me.level >= 2 and t.level < me.level
      and (me.level = 4 or t.branch_id = me.branch_id)
      and t.hidden = me.hidden
  )
$$;

-- May the signed-in person see branch-level data (leads, statistics) of branch b?
create or replace function private.can_see_branch(b smallint) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select level = 4 or (level >= 2 and b is not null and branch_id = b)
    from public.profiles where id = auth.uid() and active
  ), false)
$$;

grant execute on function private.me_level(), private.me_branch(), private.me_hidden(), private.is_gd(),
  private.can_assign(uuid), private.can_see_branch(smallint) to authenticated;

alter table public.branches enable row level security;
drop policy if exists branches_read on public.branches;
create policy branches_read on public.branches for select to authenticated using (true);

alter table public.profiles enable row level security;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using ((select private.me_level()) is not null
         and (not hidden or id = (select auth.uid()) or (select private.me_hidden())));
-- No direct insert/update/delete: profiles change only through the functions below.

-- ───────────────────────────────────────── account functions
create or replace function private.gen_password() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(12);
  result text := '';
begin
  for i in 0..11 loop
    result := result || substr(alphabet, get_byte(bytes, i) % length(alphabet) + 1, 1);
    if i in (3, 7) then result := result || '-'; end if;
  end loop;
  return result;
end $$;

create or replace function private.create_account(p_login text, p_name text, p_role text, p_branch smallint, p_hidden boolean default false)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := gen_random_uuid();
  v_login text := lower(btrim(p_login));
  v_email text := lower(btrim(p_login)) || '@therise.invalid';
  v_pwd text := private.gen_password();
begin
  if v_login !~ '^[a-z0-9][a-z0-9._-]{1,31}$' then raise exception 'Нэвтрэх нэр зөвхөн латин жижиг үсэг, тоо, цэгээс бүрдэнэ.'; end if;
  if exists (select 1 from public.profiles where login = v_login) then raise exception 'Нэвтрэх нэр давхцаж байна: %', v_login; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
          extensions.crypt(v_pwd, extensions.gen_salt('bf', 10)), now(),
          '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('login', v_login),
          now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  values (gen_random_uuid(), v_uid, v_uid::text,
          jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
          'email', now(), now());
  insert into public.profiles (id, login, display_name, role, branch_id, hidden)
  values (v_uid, v_login, btrim(p_name), p_role, case when p_role = 'general_director' then null else p_branch end, p_hidden);
  return v_pwd;
end $$;

create or replace function public.update_my_profile(p_display_name text, p_phone text default null)
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  update public.profiles
     set display_name = btrim(p_display_name), phone = nullif(btrim(coalesce(p_phone, '')), '')
   where id = auth.uid() and active
  returning * into r;
  if r.id is null then raise exception 'Нэвтрээгүй байна.'; end if;
  return r;
end $$;

create or replace function public.password_changed() returns void
language sql security definer set search_path = '' as $$
  update public.profiles set must_change_password = false where id = auth.uid();
$$;

create or replace function public.admin_accounts()
returns table (id uuid, login text, display_name text, role text, level smallint, branch_id smallint, active boolean,
               must_change_password boolean, last_sign_in_at timestamptz, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id, p.login, p.display_name, p.role, p.level, p.branch_id, p.active, p.must_change_password,
         u.last_sign_in_at, p.created_at
    from public.profiles p join auth.users u on u.id = p.id
   where private.is_gd() and not p.hidden
   order by p.level desc, p.branch_id nulls first, p.login
$$;

create or replace function public.admin_create_account(p_login text, p_name text, p_role text, p_branch smallint)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_gd() then raise exception 'Зөвхөн ерөнхий захирал данс үүсгэнэ.'; end if;
  return private.create_account(p_login, p_name, p_role, p_branch, false);
end $$;

create or replace function public.admin_reset_password(p_user uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_pwd text := private.gen_password();
begin
  if not private.is_gd() then raise exception 'Зөвхөн ерөнхий захирал нууц үг сэргээнэ.'; end if;
  if p_user = auth.uid() then raise exception 'Өөрийн нууц үгийг профайлаас солино уу.'; end if;
  update auth.users set encrypted_password = extensions.crypt(v_pwd, extensions.gen_salt('bf', 10)), updated_at = now()
   where id = p_user;
  if not found then raise exception 'Данс олдсонгүй.'; end if;
  delete from auth.sessions where user_id = p_user;
  update public.profiles set must_change_password = true where id = p_user;
  return v_pwd;
end $$;

create or replace function public.admin_update_account(p_user uuid, p_name text, p_role text, p_branch smallint, p_active boolean)
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  if not private.is_gd() then raise exception 'Зөвхөн ерөнхий захирал дансыг өөрчилнө.'; end if;
  if p_user = auth.uid() and (p_role <> 'general_director' or not p_active) then
    raise exception 'Өөрийн эрхийг бууруулах, хаах боломжгүй.';
  end if;
  update public.profiles
     set display_name = btrim(p_name), role = p_role,
         branch_id = case when p_role = 'general_director' then null else p_branch end,
         active = p_active
   where id = p_user
  returning * into r;
  if r.id is null then raise exception 'Данс олдсонгүй.'; end if;
  if not p_active then delete from auth.sessions where user_id = p_user; end if;
  return r;
end $$;

-- ───────────────────────────────────────── unified chat
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct', 'group', 'branch', 'all')),
  title text check (title is null or char_length(title) <= 80),
  branch_id smallint references public.branches (id),
  key text unique,                                 -- 'dm:<a>:<b>' or 'channel:...'
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_message_preview text
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default '-infinity',   -- a new member has read nothing yet
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists conversation_members_user_idx on public.conversation_members (user_id);

-- ───────────────────────────────────────── tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 4000),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  assignee uuid not null references public.profiles (id) on delete cascade,
  branch_id smallint references public.branches (id),
  status text not null default 'todo' check (status in ('todo', 'done', 'cancelled')),
  priority smallint not null default 0 check (priority in (0, 1)),
  due_date date,
  due_time time,
  seen_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_assignee_idx on public.tasks (assignee, status);
create index if not exists tasks_creator_idx on public.tasks (created_by, status);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid default auth.uid() references public.profiles (id) on delete set null,
  kind text not null default 'text' check (kind in ('text', 'task', 'system')),
  body text not null check (char_length(body) between 1 and 4000),
  task_id uuid references public.tasks (id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, id desc);

create or replace function private.is_member(conv uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.conversation_members where conversation_id = conv and user_id = auth.uid())
$$;
grant execute on function private.is_member(uuid) to authenticated;

create or replace function private.direct_conversation(a uuid, b uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  k text := 'dm:' || least(a::text, b::text) || ':' || greatest(a::text, b::text);
  cid uuid;
begin
  select id into cid from public.conversations where key = k;
  if cid is null then
    insert into public.conversations (kind, key, created_by) values ('direct', k, a)
    on conflict (key) do nothing returning id into cid;
    if cid is null then select id into cid from public.conversations where key = k; end if;
  end if;
  insert into public.conversation_members (conversation_id, user_id) values (cid, a), (cid, b)
  on conflict do nothing;
  return cid;
end $$;

-- Channels: one for all staff, one per branch (branch staff + general director). QA accounts are never members.
create or replace function private.sync_channels() returns void
language plpgsql security definer set search_path = '' as $$
declare b record; cid uuid;
begin
  insert into public.conversations (kind, title, key) values ('all', 'Бүх ажилтан', 'channel:all')
  on conflict (key) do nothing;
  select id into cid from public.conversations where key = 'channel:all';
  insert into public.conversation_members (conversation_id, user_id)
    select cid, p.id from public.profiles p where p.active and not p.hidden
  on conflict do nothing;
  delete from public.conversation_members m using public.profiles p
   where m.conversation_id = cid and p.id = m.user_id and (not p.active or p.hidden);

  for b in select id, name from public.branches loop
    insert into public.conversations (kind, title, branch_id, key) values ('branch', b.name, b.id, 'channel:branch:' || b.id)
    on conflict (key) do nothing;
    select id into cid from public.conversations where key = 'channel:branch:' || b.id;
    insert into public.conversation_members (conversation_id, user_id)
      select cid, p.id from public.profiles p
       where p.active and not p.hidden and (p.branch_id = b.id or p.level = 4)
    on conflict do nothing;
    delete from public.conversation_members m using public.profiles p
     where m.conversation_id = cid and p.id = m.user_id
       and (not p.active or p.hidden or (p.branch_id is distinct from b.id and p.level <> 4));
  end loop;
end $$;

create or replace function private.profiles_after_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin perform private.sync_channels(); return null; end $$;

drop trigger if exists profiles_channels on public.profiles;
create trigger profiles_channels after insert or update of branch_id, active, hidden, role or delete on public.profiles
  for each statement execute function private.profiles_after_change();

create or replace function private.messages_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.conversation_id <> old.conversation_id or new.sender_id is distinct from old.sender_id
       or new.kind <> old.kind or new.task_id is distinct from old.task_id or new.created_at <> old.created_at then
      raise exception 'Зөвхөн зурвасын текстийг засна.';
    end if;
    if new.deleted_at is not null and old.deleted_at is null then
      new.body := 'Устгасан зурвас';
    elsif new.body <> old.body then
      new.edited_at := now();
    end if;
  end if;
  return new;
end $$;

drop trigger if exists messages_before_write on public.messages;
create trigger messages_before_write before update on public.messages
  for each row execute function private.messages_before_write();

create or replace function private.messages_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations
     set last_message_at = new.created_at, last_message_preview = left(new.body, 140)
   where id = new.conversation_id;
  if new.sender_id is not null then
    update public.conversation_members set last_read_at = new.created_at
     where conversation_id = new.conversation_id and user_id = new.sender_id;
  end if;
  return null;
end $$;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert after insert on public.messages
  for each row execute function private.messages_after_insert();

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists conversations_read on public.conversations;
create policy conversations_read on public.conversations for select to authenticated
  using (private.is_member(id));

drop policy if exists members_read on public.conversation_members;
create policy members_read on public.conversation_members for select to authenticated
  using (private.is_member(conversation_id));

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated
  using (private.is_member(conversation_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and kind = 'text' and task_id is null
              and private.is_member(conversation_id));

drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages for update to authenticated
  using (sender_id = (select auth.uid()) and kind = 'text')
  with check (sender_id = (select auth.uid()));

create or replace function public.start_direct(p_other uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if private.me_level() is null then raise exception 'Нэвтрээгүй байна.'; end if;
  if p_other = me or not exists (
       select 1 from public.profiles where id = p_other and active and hidden = private.me_hidden()) then
    raise exception 'Харилцагч олдсонгүй.';
  end if;
  return private.direct_conversation(me, p_other);
end $$;

create or replace function public.create_group(p_title text, p_members uuid[]) returns uuid
language plpgsql security definer set search_path = '' as $$
declare cid uuid;
begin
  if private.me_level() is null then raise exception 'Нэвтрээгүй байна.'; end if;
  if char_length(btrim(coalesce(p_title, ''))) = 0 then raise exception 'Бүлгийн нэр оруулна уу.'; end if;
  insert into public.conversations (kind, title, created_by) values ('group', left(btrim(p_title), 80), auth.uid())
  returning id into cid;
  insert into public.conversation_members (conversation_id, user_id)
    select cid, p.id from public.profiles p
     where p.active and (p.id = auth.uid() or (p.id = any (p_members) and p.hidden = private.me_hidden()))
  on conflict do nothing;
  insert into public.messages (conversation_id, sender_id, kind, body) values (cid, auth.uid(), 'system', 'Бүлэг үүслээ');
  return cid;
end $$;

create or replace function public.mark_read(p_conversation uuid) returns void
language sql security definer set search_path = '' as $$
  update public.conversation_members set last_read_at = now()
   where conversation_id = p_conversation and user_id = auth.uid();
$$;

create or replace function public.my_conversations()
returns table (id uuid, kind text, title text, branch_id smallint, last_message_at timestamptz,
               last_message_preview text, unread integer, other_id uuid, members integer)
language sql stable security definer set search_path = '' as $$
  select c.id, c.kind, c.title, c.branch_id, c.last_message_at, c.last_message_preview,
         (select count(*)::int from public.messages m
           where m.conversation_id = c.id and m.created_at > cm.last_read_at
             and m.sender_id is distinct from auth.uid() and m.deleted_at is null),
         case when c.kind = 'direct' then
           (select x.user_id from public.conversation_members x where x.conversation_id = c.id and x.user_id <> auth.uid() limit 1)
         end,
         (select count(*)::int from public.conversation_members x where x.conversation_id = c.id)
    from public.conversation_members cm
    join public.conversations c on c.id = cm.conversation_id
   where cm.user_id = auth.uid()
   order by c.last_message_at desc
$$;

-- ───────────────────────────────────────── task rules
create or replace function private.tasks_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if uid is not null then new.created_by := uid; end if;
    new.title := btrim(new.title);
    new.branch_id := (select branch_id from public.profiles where id = new.assignee);
    new.seen_at := case when new.created_by = new.assignee then now() end;
    new.completed_at := case when new.status = 'done' then now() end;
    return new;
  end if;
  if new.id <> old.id or new.created_by <> old.created_by or new.created_at <> old.created_at then
    raise exception 'Энэ талбарыг өөрчлөх боломжгүй.';
  end if;
  if uid is not null and uid <> old.created_by then
    if new.title is distinct from old.title or new.description is distinct from old.description
       or new.due_date is distinct from old.due_date or new.due_time is distinct from old.due_time
       or new.priority is distinct from old.priority or new.assignee is distinct from old.assignee then
      raise exception 'Даалгаврыг зөвхөн өгсөн хүн засна.';
    end if;
    if new.status = 'cancelled' and old.status <> 'cancelled' then
      raise exception 'Даалгаврыг зөвхөн өгсөн хүн цуцална.';
    end if;
  end if;
  if new.assignee <> old.assignee then
    if not (new.assignee = old.created_by or private.can_assign(new.assignee)) then
      raise exception 'Энэ ажилтанд даалгавар өгөх эрхгүй.';
    end if;
    new.branch_id := (select branch_id from public.profiles where id = new.assignee);
    new.seen_at := null;
  end if;
  if new.status = 'done' and old.status <> 'done' then new.completed_at := now();
  elsif new.status <> 'done' then new.completed_at := null;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists tasks_before_write on public.tasks;
create trigger tasks_before_write before insert or update on public.tasks
  for each row execute function private.tasks_before_write();

-- Assigned tasks and their outcome appear in the direct chat between giver and receiver.
create or replace function private.tasks_after_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare cid uuid; who uuid := coalesce(auth.uid(), new.created_by);
begin
  if new.created_by = new.assignee then return null; end if;
  if tg_op = 'INSERT' or new.assignee <> old.assignee then
    cid := private.direct_conversation(new.created_by, new.assignee);
    insert into public.messages (conversation_id, sender_id, kind, body, task_id)
    values (cid, new.created_by, 'task', new.title, new.id);
  elsif new.status is distinct from old.status then
    cid := private.direct_conversation(new.created_by, new.assignee);
    insert into public.messages (conversation_id, sender_id, kind, body, task_id)
    values (cid, who, 'system',
            case new.status when 'done' then 'Дуусгасан: ' when 'cancelled' then 'Цуцалсан: ' else 'Дахин нээсэн: ' end || new.title,
            new.id);
  end if;
  return null;
end $$;

drop trigger if exists tasks_after_write on public.tasks;
create trigger tasks_after_write after insert or update on public.tasks
  for each row execute function private.tasks_after_write();

alter table public.tasks enable row level security;

drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks for select to authenticated
  using (created_by = (select auth.uid()) or assignee = (select auth.uid()) or private.can_assign(assignee));

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
  with check ((select private.me_level()) is not null and created_by = (select auth.uid())
              and (assignee = (select auth.uid()) or private.can_assign(assignee)));

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
  using (created_by = (select auth.uid()) or assignee = (select auth.uid()))
  with check (created_by = (select auth.uid()) or assignee = (select auth.uid()) or private.can_assign(assignee));

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated
  using (created_by = (select auth.uid()));

-- ───────────────────────────────────────── CRM: leads and enrolments
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  phone text check (phone is null or phone ~ '^[0-9+ ]{6,20}$'),
  course text check (course is null or char_length(course) <= 80),
  source text not null default 'other'
    check (source in ('web', 'facebook', 'messenger', 'instagram', 'phone', 'walk_in', 'referral', 'other')),
  branch_id smallint references public.branches (id),
  owner_id uuid references public.profiles (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'contacted', 'interested', 'enrolled', 'lost')),
  note text check (note is null or char_length(note) <= 2000),
  amount numeric(12, 0) check (amount is null or amount >= 0),
  preferred_time text,
  created_by uuid references public.profiles (id) on delete set null,
  contacted_at timestamptz,
  enrolled_at timestamptz
);
create index if not exists leads_branch_idx on public.leads (branch_id, created_at desc);
create index if not exists leads_owner_idx on public.leads (owner_id, status);

create or replace function private.leads_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  lvl smallint := private.me_level();
  my_b smallint := private.me_branch();
begin
  new.name := btrim(new.name);
  if tg_op = 'INSERT' then
    new.created_by := uid;
    if uid is not null then
      if new.branch_id is null and lvl < 4 then new.branch_id := my_b; end if;
      if new.owner_id is null and lvl <= 1 then new.owner_id := uid; end if;
    end if;
  else
    new.created_at := old.created_at; new.created_by := old.created_by;
  end if;
  if uid is not null and lvl is not null and lvl < 4 then
    -- staff below the general director keep leads inside their own branch
    if new.branch_id is distinct from my_b and not (tg_op = 'UPDATE' and new.branch_id is not distinct from old.branch_id) then
      raise exception 'Зөвхөн өөрийн салбарын харилцагчийг хариуцна.';
    end if;
    if new.owner_id is not null and new.owner_id <> uid
       and (tg_op = 'INSERT' or new.owner_id is distinct from old.owner_id)
       and not private.can_assign(new.owner_id) then
      raise exception 'Энэ ажилтанд харилцагч хуваарилах эрхгүй.';
    end if;
  end if;
  if new.status <> 'new' and new.contacted_at is null then new.contacted_at := now(); end if;
  if new.status = 'enrolled' and (tg_op = 'INSERT' or old.status <> 'enrolled') then new.enrolled_at := now();
  elsif new.status <> 'enrolled' then new.enrolled_at := null;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists leads_before_write on public.leads;
create trigger leads_before_write before insert or update on public.leads
  for each row execute function private.leads_before_write();

alter table public.leads enable row level security;

drop policy if exists leads_read on public.leads;
create policy leads_read on public.leads for select to authenticated
  using (owner_id = (select auth.uid()) or created_by = (select auth.uid()) or private.can_see_branch(branch_id)
         or (owner_id is null and (select private.me_level()) >= 1
             and (branch_id is null or branch_id = (select private.me_branch()))));

drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads for insert to authenticated
  with check ((select private.me_level()) >= 1);

drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads for update to authenticated
  using (owner_id = (select auth.uid()) or private.can_see_branch(branch_id)
         or (owner_id is null and (select private.me_level()) >= 1
             and (branch_id is null or branch_id = (select private.me_branch()))))
  with check ((select private.me_level()) >= 1);

drop policy if exists leads_delete on public.leads;
create policy leads_delete on public.leads for delete to authenticated
  using ((select private.me_level()) >= 2 and private.can_see_branch(branch_id));

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

-- Public website registration form (no sign-in). Validates and rate-limits per phone number.
create or replace function public.submit_web_lead(p_name text, p_phone text, p_course text, p_time text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if char_length(btrim(coalesce(p_name, ''))) < 2 or v_phone !~ '^[0-9]{8}$' then
    raise exception 'Нэр, 8 оронтой утасны дугаараа шалгана уу.';
  end if;
  if (select count(*) from public.leads where phone = v_phone and created_at > now() - interval '1 day') >= 3 then
    return true;  -- already received; do not create duplicates
  end if;
  insert into public.leads (name, phone, course, source, preferred_time)
  values (left(btrim(p_name), 120), v_phone, left(nullif(btrim(coalesce(p_course, '')), ''), 80), 'web', left(p_time, 40));
  return true;
end $$;

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

-- ───────────────────────────────────────── Facebook page statistics (filled by the fb-sync Edge Function)
create table if not exists public.fb_page_daily (
  day date primary key,
  followers integer,
  new_follows integer,
  reach integer,
  impressions integer,
  engagements integer,
  page_views integer,
  fetched_at timestamptz not null default now()
);

create table if not exists public.fb_posts (
  id text primary key,
  created_at timestamptz,
  message text,
  permalink text,
  reactions integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  fetched_at timestamptz not null default now()
);

create table if not exists public.integration_status (
  key text primary key,
  ok boolean not null default false,
  message text,
  updated_at timestamptz not null default now()
);

alter table public.fb_page_daily enable row level security;
alter table public.fb_posts enable row level security;
alter table public.integration_status enable row level security;

drop policy if exists fb_daily_read on public.fb_page_daily;
create policy fb_daily_read on public.fb_page_daily for select to authenticated using ((select private.me_level()) >= 2);
drop policy if exists fb_posts_read on public.fb_posts;
create policy fb_posts_read on public.fb_posts for select to authenticated using ((select private.me_level()) >= 2);
drop policy if exists integration_read on public.integration_status;
create policy integration_read on public.integration_status for select to authenticated using ((select private.me_level()) >= 2);

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

-- ───────────────────────────────────────── grants and realtime
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
grant execute on function public.submit_web_lead(text, text, text, text) to anon;
grant execute on function public.track_web(text, text) to anon;
revoke execute on all functions in schema private from public, anon;
grant execute on function private.me_level(), private.me_branch(), private.me_hidden(), private.is_gd(),
  private.can_assign(uuid), private.can_see_branch(smallint), private.is_member(uuid) to authenticated;

do $$
declare t text;
begin
  foreach t in array array['messages', 'tasks', 'conversation_members', 'conversations', 'leads'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ───────────────────────────────────────── one-time account seed (postgres only)
-- 1 general director, 1 branch director (branch 1), 1 senior manager per branch, 8 managers + 2 teachers per branch.
-- Display names are position placeholders; each person sets their real name in Профайл, the director can rename in Данс.
create or replace function private.seed_accounts()
returns table (login text, display_name text, position_name text, branch text, password text)
language plpgsql security definer set search_path = '' as $$
declare b int; i int;
begin
  if exists (select 1 from public.profiles p where not p.hidden) then
    raise exception 'Данснууд аль хэдийн үүссэн байна.';
  end if;
  login := 'zahiral'; display_name := 'Ерөнхий захирал'; position_name := 'Ерөнхий захирал'; branch := 'Бүх салбар';
  password := private.create_account(login, display_name, 'general_director', null); return next;
  login := 's1.zahiral'; display_name := 'Салбар 1 · Захирал'; position_name := 'Салбарын захирал'; branch := 'Салбар 1';
  password := private.create_account(login, display_name, 'branch_director', 1::smallint); return next;
  for b in 1..3 loop
    login := 's' || b || '.ahlah'; display_name := 'Салбар ' || b || ' · Ахлах менежер'; position_name := 'Ахлах менежер'; branch := 'Салбар ' || b;
    password := private.create_account(login, display_name, 'senior_manager', b::smallint); return next;
    for i in 1..8 loop
      login := 's' || b || '.menejer' || i; display_name := 'Салбар ' || b || ' · Менежер ' || i; position_name := 'Менежер';
      password := private.create_account(login, display_name, 'manager', b::smallint); return next;
    end loop;
    for i in 1..2 loop
      login := 's' || b || '.bagsh' || i; display_name := 'Салбар ' || b || ' · Багш ' || i; position_name := 'Багш';
      password := private.create_account(login, display_name, 'teacher', b::smallint); return next;
    end loop;
  end loop;
  perform private.sync_channels();
end $$;
revoke execute on function private.seed_accounts() from public, anon, authenticated;
