-- THE RISE · permission tests. Runs as simulated signed-in users inside one transaction and ROLLS BACK:
-- nothing is kept: the script always ends with an error that carries the report, which aborts the transaction.
create temp table qa (n serial, check_name text, ok boolean, info text);
grant all on qa to authenticated, anon; grant usage on sequence qa_n_seq to authenticated, anon;

create or replace function public.qa_act(login_name text) returns void language plpgsql as $$
declare uid uuid := (select id from public.profiles where login = login_name);
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create or replace function public.qa_uid(login_name text) returns uuid language sql as $$ select id from public.profiles where login = login_name $$;
grant execute on function public.qa_act(text), public.qa_uid(text) to authenticated, anon;

do $$
declare t uuid; c uuid; n int; j jsonb; m1 uuid := public.qa_uid('s1.menejer1'); b1 uuid := public.qa_uid('s1.bagsh1');
  a1 uuid := public.qa_uid('s1.ahlah'); a2 uuid := public.qa_uid('s2.ahlah'); z uuid := public.qa_uid('zahiral'); m21 uuid := public.qa_uid('s2.menejer1');
begin
  -- senior manager → own-branch manager: allowed, and the task appears in their direct chat
  perform public.qa_act('s1.ahlah');
  insert into public.tasks (title, assignee, due_date) values ('QA: тайлан бэлдэх', m1, current_date + 1) returning id into t;
  insert into qa (check_name, ok) values ('ahlah → own manager task', t is not null);
  select count(*) into n from public.messages where task_id = t and kind = 'task';
  insert into qa (check_name, ok, info) values ('task card posted to DM', n = 1, n::text);

  -- manager cannot assign to a teacher; senior manager of branch 2 cannot assign into branch 1
  perform public.qa_act('s1.menejer1');
  begin insert into public.tasks (title, assignee) values ('QA bad', b1); insert into qa values (default, 'manager → teacher blocked', false, 'inserted');
  exception when others then insert into qa values (default, 'manager → teacher blocked', true, sqlerrm); end;
  perform public.qa_act('s2.ahlah');
  begin insert into public.tasks (title, assignee) values ('QA bad', m1); insert into qa values (default, 'other-branch assign blocked', false, 'inserted');
  exception when others then insert into qa values (default, 'other-branch assign blocked', true, sqlerrm); end;
  select count(*) into n from public.tasks where id = t;
  insert into qa values (default, 'other branch cannot see task', n = 0, n::text);

  -- assignee sees it, cannot edit the title, can complete it; completion posts a system message
  perform public.qa_act('s1.menejer1');
  select count(*) into n from public.tasks where id = t;
  insert into qa values (default, 'assignee sees task', n = 1, n::text);
  begin update public.tasks set title = 'hacked' where id = t; insert into qa values (default, 'assignee title edit blocked', false, 'updated');
  exception when others then insert into qa values (default, 'assignee title edit blocked', true, sqlerrm); end;
  update public.tasks set status = 'done' where id = t;
  select count(*) into n from public.messages where task_id = t and kind = 'system';
  insert into qa values (default, 'done → system message', n = 1, n::text);

  -- branch director and general director oversee; a teacher does not
  perform public.qa_act('s1.zahiral'); select count(*) into n from public.tasks where id = t;
  insert into qa values (default, 'branch director oversees', n = 1, n::text);
  perform public.qa_act('zahiral'); select count(*) into n from public.tasks where id = t;
  insert into qa values (default, 'general director oversees', n = 1, n::text);
  perform public.qa_act('s1.bagsh1'); select count(*) into n from public.tasks where id = t;
  insert into qa values (default, 'teacher cannot see others task', n = 0, n::text);

  -- general director → branch 2 manager allowed
  perform public.qa_act('zahiral');
  begin insert into public.tasks (title, assignee) values ('QA: GD task', m21); insert into qa values (default, 'GD → any branch', true, null);
  exception when others then insert into qa values (default, 'GD → any branch', false, sqlerrm); end;

  -- chat: direct message, outsiders cannot read, channels have the right members
  perform public.qa_act('s1.menejer1');
  c := public.start_direct(b1);
  insert into public.messages (conversation_id, body) values (c, 'QA сайн уу');
  perform public.qa_act('s1.bagsh1');
  select coalesce(sum(unread), 0) into n from public.my_conversations() where id = c;
  insert into qa values (default, 'recipient unread = 1', n = 1, n::text);
  perform public.mark_read(c);
  select coalesce(sum(unread), 0) into n from public.my_conversations() where id = c;
  insert into qa values (default, 'mark_read clears', n = 0, n::text);
  perform public.qa_act('s2.menejer1'); select count(*) into n from public.messages where conversation_id = c;
  insert into qa values (default, 'outsider cannot read DM', n = 0, n::text);
  begin insert into public.messages (conversation_id, body) values (c, 'intrude'); insert into qa values (default, 'outsider cannot post', false, 'inserted');
  exception when others then insert into qa values (default, 'outsider cannot post', true, sqlerrm); end;
  begin insert into public.messages (conversation_id, body, kind) values (c, 'fake', 'system'); insert into qa values (default, 'fake system msg blocked', false, 'inserted');
  exception when others then insert into qa values (default, 'fake system msg blocked', true, sqlerrm); end;
  reset role;
  select count(*) into n from public.conversation_members m join public.conversations v on v.id = m.conversation_id where v.key = 'channel:all';
  insert into qa values (default, 'all-staff channel = 35', n = 35, n::text);
  select count(*) into n from public.conversation_members m join public.conversations v on v.id = m.conversation_id where v.key = 'channel:branch:2';
  insert into qa values (default, 'branch 2 channel = 11 + GD', n = 12, n::text);

  -- CRM: manager lead gets owner + branch; other branch cannot see; stats for leaders only
  perform public.qa_act('s1.menejer1');
  insert into public.leads (name, phone, course, source) values ('QA Харилцагч', '99112233', 'Маникюр', 'facebook') returning id into t;
  select count(*) into n from public.leads where id = t and owner_id = m1 and branch_id = 1;
  insert into qa values (default, 'lead owner/branch defaulted', n = 1, n::text);
  update public.leads set status = 'enrolled', amount = 250000 where id = t;
  begin perform public.crm_stats(current_date - 7, current_date, null); insert into qa values (default, 'manager stats blocked', false, 'allowed');
  exception when others then insert into qa values (default, 'manager stats blocked', true, sqlerrm); end;
  perform public.qa_act('s2.ahlah'); select count(*) into n from public.leads where id = t;
  insert into qa values (default, 'other branch cannot see lead', n = 0, n::text);
  j := public.crm_stats(current_date - 7, current_date, 1::smallint);
  insert into qa values (default, 'branch-2 senior sees only branch 2', (j->>'branch')::int = 2 and (j->'totals'->>'enrolled')::int = 0, j->>'branch');
  perform public.qa_act('zahiral'); j := public.crm_stats(current_date - 7, current_date, null);
  insert into qa values (default, 'GD stats include enrolment', (j->'totals'->>'enrolled')::int = 1 and (j->'totals'->>'revenue')::int = 250000, j->'totals'::text);
  insert into qa values (default, 'GD stats by_branch present', jsonb_array_length(j->'by_branch') = 3, null);

  -- accounts: only the general director
  perform public.qa_act('s1.zahiral');
  begin perform * from public.admin_accounts(); select count(*) into n from public.admin_accounts(); insert into qa values (default, 'non-GD admin list empty', n = 0, n::text);
  exception when others then insert into qa values (default, 'non-GD admin list empty', true, sqlerrm); end;
  begin perform public.admin_reset_password(m1); insert into qa values (default, 'non-GD reset blocked', false, 'allowed');
  exception when others then insert into qa values (default, 'non-GD reset blocked', true, sqlerrm); end;
  perform public.qa_act('zahiral'); select count(*) into n from public.admin_accounts();
  insert into qa values (default, 'GD lists 35 accounts', n = 35, n::text);
  begin perform public.admin_reset_password(m1); insert into qa values (default, 'GD can reset password', true, null);
  exception when others then insert into qa values (default, 'GD can reset password', false, sqlerrm); end;
  reset role;

  -- public web form (anon)
  perform set_config('role', 'anon', true);
  begin perform public.submit_web_lead('QA Вэб', '88001122', 'Дамп оператор', 'Орой'); insert into qa values (default, 'anon web lead accepted', true, null);
  exception when others then insert into qa values (default, 'anon web lead accepted', false, sqlerrm); end;
  begin perform 1 from public.leads limit 1; insert into qa values (default, 'anon cannot read leads', false, 'read');
  exception when others then insert into qa values (default, 'anon cannot read leads', true, sqlerrm); end;
  reset role;

  -- sign-in records are well-formed (NULL token columns break GoTrue sign-in)
  select count(*) into n from auth.users where email like '%@therise.invalid'
    and confirmation_token = '' and recovery_token = '' and email_change = '' and email_change_token_new = '' and email_confirmed_at is not null;
  insert into qa values (default, 'auth rows well-formed (35)', n = 35, n::text);
  select count(*) into n from auth.identities i join auth.users u on u.id = i.user_id where u.email like '%@therise.invalid' and i.provider = 'email';
  insert into qa values (default, 'identities present (35)', n = 35, n::text);
end $$;

do $$ begin raise exception E'QA REPORT (rolled back)\n%', (select string_agg(case when ok then 'PASS ' else 'FAIL ' end || check_name || coalesce(' : ' || left(info, 90), ''), E'\n' order by n) from qa); end $$;
