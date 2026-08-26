# Lịch tự viết bài

## Biến môi trường (Vercel)

| Name | Mô tả |
|------|--------|
| `CRON_SECRET` | Chuỗi bí mật tự đặt (vd random 32 ký tự) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key trong Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | Đã có |
| `ANTHROPIC_MODEL` | Tuỳ chọn, mặc định `claude-sonnet-4-6` |

**Không** dùng `NEXT_PUBLIC_` cho service role / cron secret.

## Vercel Cron

File `vercel.json` chạy **mỗi ngày 00:00 UTC** (= 07:00 sáng VN):

```json
{ "path": "/api/cron/generate-drafts", "schedule": "0 0 * * *" }
```

Hobby plan: tối đa 1 cron/ngày — đủ.

Vercel tự gửi header `Authorization: Bearer $CRON_SECRET` nếu bạn cấu hình secret tên `CRON_SECRET` (Vercel Cron Secrets).

Hoặc test thủ công:

```bash
curl -X GET "https://YOUR_DOMAIN/api/cron/generate-drafts" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Logic

- Chỉ user **đã khóa** Brand Profile + có roadmap
- `postsPerWeek` 3 / 5 / 7 (chọn trên trang Lộ trình)
- Đúng ngày trong lịch mới tạo
- Tối đa 1 bài/lần chạy/user; không vượt quota tuần
- Còn ≥5 bài `pending` → bỏ qua

## Nhịp

| postsPerWeek | Ngày tạo |
|--------------|----------|
| 3 | T2, T4, T6 |
| 5 | T2–T6 |
| 7 | Mỗi ngày |
