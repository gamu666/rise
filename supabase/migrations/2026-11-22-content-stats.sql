-- 2026-11-22 · Content research for the CRM Маркетинг view (owner request 2026-11-22: "page дээр контентын үзэлт,
-- хандалтаас судалгаа гаргадаг").
-- 1. Website: leaders read the daily anonymous counters per page (views, "Бүртгүүлэх" clicks, call and Messenger
--    clicks) so the CRM can draw trends, weekday patterns and compare with the previous period. web_daily itself stays
--    closed (no policies); this function returns counts only, never anything about a visitor.
-- 2. Facebook: fb_posts keeps each post's reach, impressions, clicks and media type, so posts can be compared by how
--    many people saw them, not only by reactions. The fb-sync Edge Function fills them (supabase/functions/fb-sync).
-- Re-runnable. Apply before uploading the manager-crm.js that calls web_daily_stats.

alter table public.fb_posts add column if not exists reach integer;
alter table public.fb_posts add column if not exists impressions integer;
alter table public.fb_posts add column if not exists clicks integer;
alter table public.fb_posts add column if not exists media_type text;

-- Daily website counters for leaders (ахлах менежер and above). Up to 800 days, so a period and the period before it
-- can be read in one call. One site serves every branch, so the figures are company-wide.
create or replace function public.web_daily_stats(p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(private.me_level(), 0) < 2 then raise exception 'Статистикийг зөвхөн удирдлага харна.'; end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 800 then raise exception 'Хугацааны мужаа шалгана уу.'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('day', day, 'page', page, 'view', v, 'register', r, 'call', c, 'messenger', m) order by day, page)
      from (select w.day, w.page,
                   coalesce(sum(w.n) filter (where w.event = 'view'), 0) v,
                   coalesce(sum(w.n) filter (where w.event = 'register'), 0) r,
                   coalesce(sum(w.n) filter (where w.event = 'call'), 0) c,
                   coalesce(sum(w.n) filter (where w.event = 'messenger'), 0) m
              from public.web_daily w
             where w.day between p_from and p_to
             group by w.day, w.page) s), '[]'::jsonb);
end $$;

revoke execute on function public.web_daily_stats(date, date) from public, anon;
grant execute on function public.web_daily_stats(date, date) to authenticated;
