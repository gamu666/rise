# Facebook хуудсыг CRM статистикт холбох

Нэг удаа хийнэ. Дараа нь систем өдөр бүр автоматаар татна (дагагч, хүрээ, оролцоо, хуудас үзэлт, нийтлэл бүрийн
хүрээ, үзэлт, дарсан тоо, reaction, сэтгэгдэл, хуваалцалт).
Token-ийг зөвхөн хүн (хуудасны админ) өөрөө Supabase-д хадгална — кодонд, GitHub-д хэзээ ч орохгүй.

Төлөв (2026-11-22): холбогдсон. App `THE RISE CRM` (App ID 1127795656631933), хуудас "THE RISE санхүүгийн цогц
сургалтын төв" (ID 409031592763487), business portfolio "Rise page remote". `FB_PAGE_TOKEN` нь system user
**RiseCrmSync**-ийн хугацаагүй ("Never") token. Verify JWT унтраасан, cron `fb-sync-daily` (job 1) өдөр бүр 06:00
(Улаанбаатар) ажиллана. Token зөвхөн system user устгагдах, түүний token-уудыг "Revoke tokens" хийх, хуудас эсвэл app
portfolio-оос хасагдах үед хүчингүй болно — тэр үед Статистик хуудсанд "Facebook token хүчингүй болсон" гэж гарна.

## 1. Meta app (хийгдсэн)
1. https://developers.facebook.com/apps → **Create app** → нэр `THE RISE CRM` → use case **Manage everything on your Page**.
2. **Use cases → Customize**: `pages_show_list`, `pages_read_engagement`, `read_insights` → **Add** ("Ready for testing").
3. App нь **Development** горимд үлдэнэ.

## 2. Хугацаагүй token (system user, хийгдсэн)
Хуудсыг удирддаг, app-ын админ бүртгэлээр (Дижитал Хариуцах) business.facebook.com → **Rise page remote** → Settings:
1. **Accounts → Apps → Add → Connect an app ID** → 1127795656631933 (app-ын админ тул шууд зөвшөөрөгдөнө).
2. **Users → System users → Add** → нэр `RiseCrmSync` (Meta "THE RISE CRM sync" нэрийг зөвшөөрөөгүй), эрх **Employee**.
   Анх удаа Non-discrimination policy-г зөвшөөрнө (2026-11-22-нд зөвшөөрсөн).
3. **Assign assets** → Facebook Pages → THE RISE санхүүгийн цогц сургалтын төв → зөвхөн **Content** ба **Insights**;
   Apps → THE RISE CRM → **Test app** (энэ эрхгүй бол token-д permission сонгогдохгүй).
4. **Generate token** → THE RISE CRM → **Never** → `pages_show_list`, `pages_read_engagement`, `read_insights` →
   Generate token → **Copy** (нэг л удаа харагдана) → Supabase `FB_PAGE_TOKEN`-д буулгана.
fb-sync ажиллах бүрдээ энэ token-оор хуудасны өөрийн token-ийг авдаг (`/{page-id}?fields=access_token`).

Нөөц арга (60 хоногийн token): https://developers.facebook.com/tools/explorer → THE RISE CRM → дээрх 3 эрх →
Generate Access Token → THE RISE хуудсыг сонгох → **i** → Open in Access Token Tool → **Extend Access Token**.

## 3. Supabase-д хадгалах
Supabase → төсөл **the-rise** → **Edge Functions → Secrets** (ижил нэрээр хадгалбал "Replace secret" гэж асууна):
- `FB_PAGE_ID` = 409031592763487
- `FB_PAGE_TOKEN` = system user token (эсвэл хуудасны token)

## 4. Шалгах
Edge Functions → **fb-sync** → **Test** → `{"ok": true, "days": 30, "posts": 50, "skipped": []}` маягийн хариу.
Амжилттай синкээс хойш 1 цагийн дотор дахин дуудвал `"skipped": "synced less than an hour ago"` гэж буцна (зориуд).
CRM → Маркетинг болон Статистик хуудсанд тоо гарна; алдаа гарвал шалтгааныг integration_status-д бичнэ.

## Техникийн тэмдэглэл
- Функцийн код: `supabase/functions/fb-sync/index.ts` (Graph API v27.0; `FB_API_VERSION` нууцаар өөрчилж болно).
  Dashboard → Edge Functions → fb-sync → **Code** → кодыг буулгаад **Deploy updates**.
- Reaction/сэтгэгдлийн тоог `reactions`/`comments` талбараар авахад `pages_read_user_content` эрх хэрэгтэй (Meta
  2026-11-22-нд татгалзсан) тул нийтлэлийн insights-аас (`post_reactions_by_type_total`, `post_activity_by_action_type`) авна.
- **Verify JWT**: унтраасан (админ 2026-11-22). Доорх cron түлхүүргүй дууддаг тул асаалттай бол cron татгалзагдана.
  URL нээлттэй боловч функц амжилттай синкээс хойш 1 цаг дахин Meta-аас татахгүй, зөвхөн хуудасны статистик бичнэ.
- Өдөр бүр 06:00 (Улаанбаатар) ажиллуулах (2026-11-22-нд тохируулсан, job 1). Бүтэн синк 15–25 секунд үргэлжилдэг
  тул pg_net-ийн 5 секундын анхны хүлээлтийг 60 секунд болгосон:
  ```sql
  create extension if not exists pg_cron with schema pg_catalog;
  create extension if not exists pg_net with schema extensions;
  select cron.schedule('fb-sync-daily', '0 22 * * *',
    $$ select net.http_post(url := 'https://lwgxvtkhetkelmihaynt.supabase.co/functions/v1/fb-sync', body := '{}'::jsonb, timeout_milliseconds := 60000) $$);
  ```
  Шалгах: `select * from cron.job_run_details order by start_time desc limit 5;` ба
  `select status_code, content, timed_out from net._http_response order by created desc limit 5;`
- Meta зарим үзүүлэлтийг үе үе хасдаг. Хасагдсан үзүүлэлт алгасагдаж, бусад нь үргэлжлэн татагдана.
