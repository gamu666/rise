// CRM (Харилцагч) views, owner request 2026-11-22: more sections, more ways to look at the same leads, charts and analysis.
// Everyone: Жагсаалт, Хүснэгт, Самбар, Шинжилгээ; leaders also Маркетинг. Numbers come only from the leads row level
// security lets the account read (and crm_stats for leaders); nothing is generated.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const js = fs.readFileSync(path.join(__dirname, '../manager-crm.js'), 'utf8'), css = fs.readFileSync(path.join(__dirname, '../manager-crm.css'), 'utf8');
const code = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
assert.ok(js.includes("[['list', 'Жагсаалт'], ['table', 'Хүснэгт'], ['board', 'Самбар'], ['insights', 'Шинжилгээ']].concat(leader() ? [['marketing', 'Маркетинг']] : [])"), 'four views for everyone, Маркетинг for leaders');
assert.ok(/RISE\.sb\.from\('leads'\)\.select\('\*'\)/.test(code) && /RISE\.sb\.rpc\('crm_stats'/.test(code), 'data from Supabase: leads (RLS) and crm_stats');
assert.ok(!/Math\.random|Жишээ/.test(code), 'no generated or sample numbers');
// board: a drop saves the status through Supabase; Элссэн opens the lead because an enrolment needs its payment
assert.ok(code.includes("if (status === 'enrolled') { openLead(l, { status }); return; }"), 'dropping on Элссэн asks for the payment');
assert.ok(code.includes("RISE.sb.from('leads').update({ status }).eq('id', id).select().single()"), 'a drop is saved, not only drawn');
assert.ok(/if \(error\) \{ l\.status = before; render\(\); say\(problemText\(error\)\); return; \}/.test(code), 'a refused drop goes back and says why');
// table: every column sorts both ways
assert.equal((code.match(/\['(name|phone|course|source|status|owner|created|amount)', '[^']+'\]/g) || []).length, 8, 'eight sortable columns');
// analysis: validated palette, real-width chart that the global "svg{width:14px}" cannot shrink, a table twin, deltas
assert.ok(code.includes("leads: '#2a78d6', enrolled: '#eb6834'"), 'two-series palette checked with the dataviz validator');
assert.ok(code.includes('style="width:${W}px;height:${H}px"'), 'chart size is inline');
assert.ok((code.match(/<details class="crm-data">/g) || []).length >= 3, 'trend, heat map and website figures have a table view');
assert.ok(/const since = S\.range === 'month'/.test(code) && /if \(S\.range === 'all' \|\| prev == null/.test(code), 'deltas compare with the previous period of the same length, none for Бүгд');
assert.ok(/lowerBetter: true/.test(code), 'a shorter reply time counts as better');
// layout
assert.ok(/\.crm-board\{[^}]*grid-auto-flow:column/.test(css) && /\.crm-board\{grid-auto-columns:200px\}/.test(css), 'board columns, phone columns narrower than the card');
assert.ok(/\.crm-full\{display:none\}/.test(css) && /\.crm-compact\{display:inline\}/.test(css), 'phone tiles show the short amount');
assert.ok(/\.crm-chart svg\{[^}]*stroke:none/.test(css), 'the global svg stroke rule cannot outline the charts');
// content research (owner request 2026-11-22): website traffic per day and Facebook page content, with findings
assert.ok(code.includes("RISE.sb.rpc('web_daily_stats', { p_from: prevFrom, p_to: to })"), 'daily website counters, current and previous period');
assert.ok(code.includes("RISE.sb.from('fb_page_daily')") && code.includes("RISE.sb.from('fb_posts')"), 'Facebook page days and posts (leaders may read them)');
assert.ok(/const rated = courses\.filter\(r => r\.view >= 20\)/.test(code) && /if \(posts\.length >= 6\)/.test(code) && /g\.posts >= 2/.test(code), 'a finding is said only with enough data behind it');
assert.ok(/if \(!F\.any\) return/.test(code) && code.includes('Пэйж холбогдоогүй байна'), 'an unconnected page says so instead of showing zeros');
assert.ok(!/тэйтэй|тойтой|[ÐÑ][\u0080-¿]/.test(js), 'Mongolian text is intact (no doubled suffix, no broken encoding)');
const mig = fs.readFileSync(path.join(__dirname, '../supabase/migrations/2026-11-22-content-stats.sql'), 'utf8');
assert.ok(/coalesce\(private\.me_level\(\), 0\) < 2/.test(mig) && /revoke execute on function public\.web_daily_stats\(date, date\) from public, anon;/.test(mig), 'web_daily_stats is for leaders, never anon');
assert.ok(/add column if not exists reach integer/.test(mig) && /add column if not exists media_type text/.test(mig), 'posts keep reach and media type');
const sync = fs.readFileSync(path.join(__dirname, '../supabase/functions/fb-sync/index.ts'), 'utf8');
// Meta retired page_impressions(_unique) and post_impressions(_unique) for every API version (2025): the media-view
// metrics are tried first, the old names second, and posts are still stored when Meta refuses all post insights.
assert.ok(/\['reach', \['page_total_media_view_unique', 'page_impressions_unique'\]\]/.test(sync) && /\['impressions', \['page_media_view', 'page_impressions'\]\]/.test(sync), 'page metrics: new names first, retired names as fallback');
assert.ok(/reach: 'post_total_media_view_unique', impressions: 'post_media_view'/.test(sync) && /if \(!names\) \{ notes\.push\(`post insights/.test(sync), 'post reach with fallbacks; posts kept without insights');
assert.ok(!/'page_follows'/.test(sync), 'new followers never fall back to a running total');
// Meta refused reactions/comments summaries without pages_read_user_content (2026-11-22, Graph API v27.0): reactions
// and comments come from the post insights instead, and a post set without them is still stored.
assert.ok(!/reactions\.summary|comments\.summary/.test(sync), 'no fields that need pages_read_user_content');
assert.ok(sync.includes("const ENGAGEMENT = 'post_reactions_by_type_total,post_activity_by_action_type';") && /engagement: false/.test(sync), 'engagement from insights, with a fallback without it');
assert.ok(/m\.period === 'lifetime'/.test(sync), 'post metrics read the lifetime value');
assert.ok(/if \(last\?\.ok && Date\.now\(\) - new Date\(last\.updated_at\)\.getTime\(\) < 3600_000\)/.test(sync), 'an open URL cannot make it call Meta more than once an hour after a success');
console.log('PASS: CRM list, sortable table, drag-and-drop board, analysis with validated colours and table views, leaders-only marketing with website and Facebook content research');
