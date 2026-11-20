# Facebook хуудсыг CRM статистикт холбох

Нэг удаа хийнэ. Дараа нь систем өдөр бүр автоматаар татна (дагагч, хүрээ, оролцоо, хуудас үзэлт, шилдэг нийтлэл).
Token-ийг зөвхөн та (хуудасны админ) өөрөө Supabase-д хадгална — кодонд, GitHub-д хэзээ ч орохгүй.

## 1. Meta app үүсгэх (5 мин)
1. https://developers.facebook.com/apps → **Create app** → төрөл **Business** (эсвэл "Other → Business").
2. App-ын нэр: `THE RISE CRM`. Business portfolio байвал сонгоно.
3. App нь **Development** горимд үлдэж болно: хуудасны админ өөрөө app-ын admin учраас өөрийн хуудасны статистикийг уншиж чадна.

## 2. Page token авах
1. https://developers.facebook.com/tools/explorer → дээд талд өөрийн app-ыг сонгоно.
2. **Permissions**: `pages_show_list`, `pages_read_engagement`, `read_insights` нэмнэ → **Generate Access Token** → хуудсаа зөвшөөрнө.
3. **User or Page** талбараас THE RISE хуудсыг сонгоход Page access token гарна.
4. Урт хугацааны болгох: https://developers.facebook.com/tools/debug/accesstoken → token-оо оруулж **Extend Access Token**.
   Урт хугацааны user token-оос гаргасан Page token ихэвчлэн хугацаагүй байдаг.
5. Хуудасны ID: Explorer дээр `me?fields=id,name` (Page token сонгосон үед) → `id`.

## 3. Supabase-д хадгалах
Supabase → төсөл **the-rise** → **Edge Functions → Secrets** → **Add new secret**:
- `FB_PAGE_ID` = хуудасны ID
- `FB_PAGE_TOKEN` = Page access token

## 4. Шалгах
Edge Functions → **fb-sync** → **Test** (эсвэл доорх cron ажиллахыг хүлээх). Статистик хуудасны "Facebook хуудас"
хэсэгт тоо гарч ирнэ, алдаа гарвал шалтгааныг тэнд бичнэ.

## Техникийн тэмдэглэл
- Функцийн код: `supabase/functions/fb-sync/index.ts`. Dashboard → Edge Functions → Deploy a new function → Via editor,
  нэр `fb-sync`, кодыг буулгаад **Verify JWT** унтраана (функц нууцгүй, зөвхөн хуудасны статистик бичнэ).
- Өдөр бүр 06:00 (Улаанбаатар) ажиллуулах: SQL editor дээр
  ```sql
  create extension if not exists pg_cron; create extension if not exists pg_net;
  select cron.schedule('fb-sync-daily', '0 22 * * *',
    $$ select net.http_post(url := 'https://lwgxvtkhetkelmihaynt.supabase.co/functions/v1/fb-sync', body := '{}'::jsonb) $$);
  ```
- Meta зарим үзүүлэлтийг үе үе хасдаг. Хасагдсан үзүүлэлт алгасагдаж, бусад нь үргэлжлэн татагдана.
