# Facebook хуудсыг CRM статистикт холбох

Нэг удаа хийнэ. Дараа нь систем өдөр бүр автоматаар татна (дагагч, хүрээ, оролцоо, хуудас үзэлт, нийтлэл бүрийн
хүрээ, үзэлт, дарсан тоо, reaction, сэтгэгдэл, хуваалцалт).
Token-ийг зөвхөн та (хуудасны админ) өөрөө Supabase-д хадгална — кодонд, GitHub-д хэзээ ч орохгүй.

Төлөв (2026-11-22): холбогдсон. App `THE RISE CRM` (App ID 1127795656631933), хуудас "THE RISE санхүүгийн цогц
сургалтын төв" (ID 409031592763487). Эхний синк: 30 өдөр, 50 нийтлэл. Verify JWT унтраасан, cron `fb-sync-daily`
(job 1) өдөр бүр 06:00 (Улаанбаатар) ажиллана. Page token **2027-01-21**-нд дуусна — түүнээс өмнө 2-р алхмыг давтаж
шинэ token-оо `FB_PAGE_TOKEN`-д солино (эсвэл доорх "хугацаагүй token"-ийг хийнэ).

## 1. Meta app үүсгэх (хийгдсэн)
1. https://developers.facebook.com/apps → **Create app** → нэр `THE RISE CRM` → use case **Manage everything on your Page**
   → business portfolio холбохгүй → **Create app**.
2. **Use cases → Customize**: `pages_show_list`, `pages_read_engagement`, `read_insights` → **Add** ("Ready for testing").
3. App нь **Development** горимд үлдэнэ: хуудасны админ өөрөө app-ын admin учраас өөрийн хуудасны статистикийг уншина.

## 2. Page token авах
1. https://developers.facebook.com/tools/explorer → **Meta App**: THE RISE CRM.
2. **Permissions**: дээрх 3 эрх → **Generate Access Token** → Facebook цонхонд **Opt in to current Pages only** →
   THE RISE хуудсыг сонгоно → Save.
3. **User or Page** талбараас THE RISE хуудсыг сонгоно → token-ий хажуугийн **i** → **Open in Access Token Tool** →
   **Extend Access Token** (Facebook нууц үгээ дахин асууна) → гарсан урт token (Page, 60 хоног).
4. Хуудасны ID: Explorer дээр `me/accounts?fields=id,name` → `id`.

Хугацаагүй token (дараа хийх): business portfolio-д system user үүсгэж, THE RISE хуудас болон app-ыг түүнд оноож,
"Never" хугацаатай token гаргана. Тэгвэл 60 хоног тутам солих шаардлагагүй.

## 3. Supabase-д хадгалах
Supabase → төсөл **the-rise** → **Edge Functions → Secrets**:
- `FB_PAGE_ID` = хуудасны ID
- `FB_PAGE_TOKEN` = Page access token (админ өөрөө хуулж оруулна)

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
