# Hướng dẫn bật Đăng nhập (Supabase) — MVP

## Phương án đã chọn
- Đăng nhập bằng **Google** hoặc **Email (magic link)**
- Lưu dữ liệu user bằng **Supabase** (auth + database)
- Chưa cấu hình env thì site vẫn chạy demo; khi gắn env sẽ bắt đăng nhập trước onboarding/profile/drafts

## Bước 1 — Tạo project Supabase
1. Vào https://supabase.com → New project
2. Đặt tên (ví dụ: personal-brand-ai)
3. Lưu password database

## Bước 2 — Lấy API keys
1. Project Settings → API
2. Copy:
   - Project URL
   - anon public key

## Bước 3 — Chạy schema
1. Trong Supabase → SQL Editor
2. Dán toàn bộ file `supabase/schema.sql`
3. Run

## Bước 4 — Bật Google login (khuyến nghị)
1. Authentication → Providers → Google → Enable
2. Tạo OAuth Client trên Google Cloud (Web)
3. Callback URL lấy trong Supabase Google provider
4. Dán Client ID / Secret vào Supabase

## Bước 5 — Email magic link
1. Authentication → Providers → Email → Enable
2. (Dev) có thể bật confirm email tùy nhu cầu

## Bước 6 — Gắn env local
Tạo file `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Bước 7 — Gắn env trên Vercel
Project → Settings → Environment Variables → thêm 2 biến trên → Redeploy

## Bước 8 — Redirect URLs
Supabase → Authentication → URL Configuration:
- Site URL: https://domain-vercel-của-bạn
- Redirect URLs: https://domain-vercel-của-bạn/auth/callback

## Luồng user sau khi bật
Đăng nhập → Onboarding → Brand Profile (lưu DB) → Lộ trình → Chờ duyệt
