// THE RISE · fb-sync Edge Function. Pulls Facebook Page statistics into fb_page_daily / fb_posts.
// Secrets (Supabase → Edge Functions → Secrets): FB_PAGE_ID, FB_PAGE_TOKEN, optional FB_API_VERSION (default v27.0).
// Runs daily from pg_cron (see supabase/FACEBOOK.md). Each metric is fetched separately so a metric Meta
// retires does not stop the rest; the outcome is written to integration_status for the Статистик page.
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Server key: the project's new secret key (SUPABASE_SECRET_KEYS is a JSON dictionary of them), else the legacy
// service role key that Supabase still provides to Edge Functions.
const secretKey = (() => { try { const v = Object.values(JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}'))[0]; return typeof v === 'string' ? v : ''; } catch { return ''; } })();
const db = createClient(Deno.env.get('SUPABASE_URL')!, secretKey || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY')!);
const PAGE = Deno.env.get('FB_PAGE_ID') ?? '';
const TOKEN = Deno.env.get('FB_PAGE_TOKEN') ?? '';
const V = Deno.env.get('FB_API_VERSION') ?? 'v27.0';
const G = `https://graph.facebook.com/${V}`;

// Column → Page metrics to try, newest name first. Meta retired page_impressions_unique (June 2025) and
// page_impressions (November 2025) for every API version; the "media view" metrics replace them (they count views, so
// the numbers are not 1:1 with the old impressions). The first name Meta accepts fills the column.
const METRICS: Array<[string, string[]]> = [
  ['reach', ['page_total_media_view_unique', 'page_impressions_unique']],
  ['impressions', ['page_media_view', 'page_impressions']],
  ['engagements', ['page_post_engagements']],
  ['page_views', ['page_views_total']],
  ['new_follows', ['page_daily_follows_unique']],
];
// Per-post metrics, newest names first, then the retired ones, then none (posts are still stored). Reaction and comment
// counts come from the post's own insights: reading them through reactions/comments needs pages_read_user_content,
// which the THE RISE CRM app does not ask for (Meta refused those fields on 2026-11-22).
const ENGAGEMENT = 'post_reactions_by_type_total,post_activity_by_action_type';
const POST_METRICS = [
  { reach: 'post_total_media_view_unique', impressions: 'post_media_view', clicks: 'post_clicks', engagement: true },
  { reach: 'post_total_media_view_unique', impressions: 'post_media_view', clicks: 'post_clicks', engagement: false },
  { reach: 'post_impressions_unique', impressions: 'post_impressions', clicks: 'post_clicks', engagement: false },
];

async function graph(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${G}/${path}`);
  for (const [k, v] of Object.entries({ ...params, access_token: TOKEN })) url.searchParams.set(k, v);
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  return body;
}

async function status(ok: boolean, message: string) {
  await db.from('integration_status').upsert({ key: 'facebook', ok, message, updated_at: new Date().toISOString() });
}

Deno.serve(async () => {
  if (!PAGE || !TOKEN) {
    await status(false, 'FB_PAGE_ID, FB_PAGE_TOKEN нууцуудыг Supabase-д хадгалаагүй байна.');
    return Response.json({ ok: false, reason: 'missing secrets' }, { status: 200 });
  }
  // The daily pg_cron call carries no key, so this URL is open once Verify JWT is off: a call within an hour of a
  // successful sync returns without asking Meta again, so repeated calls cannot use up the Graph API limits.
  const { data: last } = await db.from('integration_status').select('ok, updated_at').eq('key', 'facebook').maybeSingle();
  if (last?.ok && Date.now() - new Date(last.updated_at).getTime() < 3600_000) {
    return Response.json({ ok: true, skipped: 'synced less than an hour ago' });
  }
  const notes: string[] = [];
  try {
    const until = Math.floor(Date.now() / 1000), since = until - 30 * 86400;
    const days = new Map<string, Record<string, number | string>>();
    for (const [column, names] of METRICS) {
      let last = '';
      for (const metric of names) {
        try {
          const r = await graph(`${PAGE}/insights`, { metric, period: 'day', since: String(since), until: String(until) });
          for (const v of r.data?.[0]?.values ?? []) {
            const day = String(v.end_time).slice(0, 10);
            const row = days.get(day) ?? { day };
            row[column] = typeof v.value === 'number' ? v.value : 0;
            days.set(day, row);
          }
          last = ''; break;
        } catch (e) { last = `${metric}: ${(e as Error).message}`; }
      }
      if (last) notes.push(last);
    }
    const page = await graph(PAGE, { fields: 'followers_count,fan_count,name' });
    const todayKey = new Date().toISOString().slice(0, 10);
    days.set(todayKey, { ...(days.get(todayKey) ?? { day: todayKey }), followers: page.followers_count ?? page.fan_count ?? null });
    if (days.size) {
      const { error } = await db.from('fb_page_daily').upsert([...days.values()].map(r => ({ ...r, fetched_at: new Date().toISOString() })));
      if (error) throw error;
    }

    // Each post's reach, views, clicks and engagement (content research in the CRM Маркетинг view, 2026-11-22). If Meta
    // refuses the post insights (permission or a retired metric), the posts are still stored without them.
    const base = 'id,created_time,message,permalink_url,status_type,attachments{media_type},shares';
    let posts, names: (typeof POST_METRICS)[number] | null = null, refused = '';
    for (const set of POST_METRICS) {
      const list = [set.reach, set.impressions, set.clicks].concat(set.engagement ? [ENGAGEMENT] : []).join(',');
      try { posts = await graph(`${PAGE}/posts`, { fields: `${base},insights.metric(${list})`, limit: '50' }); names = set; break; }
      catch (e) { refused = (e as Error).message; }
    }
    if (!names) { notes.push(`post insights: ${refused}`); posts = await graph(`${PAGE}/posts`, { fields: base, limit: '50' }); }
    else if (!names.engagement) notes.push(`post engagement: ${refused}`);
    // A metric's lifetime value (Meta may list other periods too); reactions by type and activity by action are objects.
    const metric = (p: any, name?: string): any => {
      if (!name) return undefined;
      const found = (p.insights?.data ?? []).filter((m: any) => m.name === name);
      return (found.find((m: any) => m.period === 'lifetime') ?? found[0])?.values?.[0]?.value;
    };
    const count = (v: unknown) => typeof v === 'number' ? v : null;
    const total = (v: unknown) => v && typeof v === 'object' ? Object.values(v as Record<string, unknown>).reduce((t: number, n) => t + (Number(n) || 0), 0) : 0;
    const rows = (posts.data ?? []).map((p: any) => ({
      id: p.id, created_at: p.created_time, message: p.message ?? null, permalink: p.permalink_url ?? null,
      reactions: names?.engagement ? total(metric(p, 'post_reactions_by_type_total')) : 0,
      comments: names?.engagement ? Number(metric(p, 'post_activity_by_action_type')?.comment) || 0 : 0,
      shares: p.shares?.count ?? 0,
      reach: count(metric(p, names?.reach)), impressions: count(metric(p, names?.impressions)), clicks: count(metric(p, names?.clicks)),
      media_type: String(p.attachments?.data?.[0]?.media_type ?? p.status_type ?? '').toLowerCase() || null,
      fetched_at: new Date().toISOString(),
    }));
    if (rows.length) { const { error } = await db.from('fb_posts').upsert(rows); if (error) throw error; }

    await status(true, `${page.name ?? 'Хуудас'}: ${days.size} өдөр, ${rows.length} нийтлэл шинэчлэгдлээ.` + (notes.length ? ` Татаагүй үзүүлэлт: ${notes.map(n => n.split(':')[0]).join(', ')}.` : ''));
    return Response.json({ ok: true, days: days.size, posts: rows.length, skipped: notes });
  } catch (e) {
    const message = (e as Error).message;
    await status(false, /expired|session|token/i.test(message) ? 'Facebook token хүчингүй болсон. Шинэ Page token үүсгэж солино уу.' : 'Facebook-ээс татаж чадсангүй: ' + message);
    return Response.json({ ok: false, error: message }, { status: 200 });
  }
});
