// THE RISE · fb-sync Edge Function. Pulls Facebook Page statistics into fb_page_daily / fb_posts.
// Secrets (Supabase → Edge Functions → Secrets): FB_PAGE_ID, FB_PAGE_TOKEN, optional FB_API_VERSION (default v23.0).
// Runs daily from pg_cron (see supabase/FACEBOOK.md). Each metric is fetched separately so a metric Meta
// retires does not stop the rest; the outcome is written to integration_status for the Статистик page.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')!);
const PAGE = Deno.env.get('FB_PAGE_ID') ?? '';
const TOKEN = Deno.env.get('FB_PAGE_TOKEN') ?? '';
const V = Deno.env.get('FB_API_VERSION') ?? 'v23.0';
const G = `https://graph.facebook.com/${V}`;

const METRICS: Record<string, string> = {
  page_impressions_unique: 'reach',
  page_impressions: 'impressions',
  page_post_engagements: 'engagements',
  page_views_total: 'page_views',
  page_daily_follows_unique: 'new_follows',
};

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
  const notes: string[] = [];
  try {
    const until = Math.floor(Date.now() / 1000), since = until - 30 * 86400;
    const days = new Map<string, Record<string, number | string>>();
    for (const [metric, column] of Object.entries(METRICS)) {
      try {
        const r = await graph(`${PAGE}/insights`, { metric, period: 'day', since: String(since), until: String(until) });
        for (const v of r.data?.[0]?.values ?? []) {
          const day = String(v.end_time).slice(0, 10);
          const row = days.get(day) ?? { day };
          row[column] = typeof v.value === 'number' ? v.value : 0;
          days.set(day, row);
        }
      } catch (e) { notes.push(`${metric}: ${(e as Error).message}`); }
    }
    const page = await graph(PAGE, { fields: 'followers_count,fan_count,name' });
    const todayKey = new Date().toISOString().slice(0, 10);
    days.set(todayKey, { ...(days.get(todayKey) ?? { day: todayKey }), followers: page.followers_count ?? page.fan_count ?? null });
    if (days.size) {
      const { error } = await db.from('fb_page_daily').upsert([...days.values()].map(r => ({ ...r, fetched_at: new Date().toISOString() })));
      if (error) throw error;
    }

    const posts = await graph(`${PAGE}/posts`, { fields: 'id,created_time,message,permalink_url,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)', limit: '50' });
    const rows = (posts.data ?? []).map((p: any) => ({
      id: p.id, created_at: p.created_time, message: p.message ?? null, permalink: p.permalink_url ?? null,
      reactions: p.reactions?.summary?.total_count ?? 0, comments: p.comments?.summary?.total_count ?? 0, shares: p.shares?.count ?? 0,
      fetched_at: new Date().toISOString(),
    }));
    if (rows.length) { const { error } = await db.from('fb_posts').upsert(rows); if (error) throw error; }

    await status(true, `${page.name ?? 'Хуудас'}: ${days.size} өдөр, ${rows.length} нийтлэл шинэчлэгдлээ.` + (notes.length ? ` Татаагүй үзүүлэлт: ${notes.length}.` : ''));
    return Response.json({ ok: true, days: days.size, posts: rows.length, skipped: notes });
  } catch (e) {
    const message = (e as Error).message;
    await status(false, /expired|session|token/i.test(message) ? 'Facebook token хүчингүй болсон. Шинэ Page token үүсгэж солино уу.' : 'Facebook-ээс татаж чадсангүй: ' + message);
    return Response.json({ ok: false, error: message }, { status: 200 });
  }
});
