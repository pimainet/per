# Brand Visual + Ảnh bài viết (Pha 1)

## SQL (Supabase → SQL Editor)

```sql
-- Kit nhận diện ảnh (1 user = 1 row)
create table if not exists brand_visuals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table brand_visuals enable row level security;

create policy "brand_visuals_own"
  on brand_visuals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Lưu ảnh đã chọn trên draft
alter table drafts
  add column if not exists image_url text,
  add column if not exists image_urls jsonb default '[]'::jsonb;

-- Quota tạo ảnh: dùng memories kind = image_gen
-- (không cần bảng mới)
```

## Biến môi trường Vercel

| Name | Mô tả |
|------|--------|
| `OPENAI_API_KEY` | Key OpenAI — dùng `gpt-image-1` hoặc `dall-e-3` |
| `OPENAI_IMAGE_MODEL` | Tuỳ chọn, mặc định `dall-e-3` |

Chỉ **paid** mới gọi API ảnh.

## Thứ tự làm của user

1. Chạy SQL trên
2. Deploy code
3. Vào **/nhan-dien** điền kit
4. Duyệt bài → **Gợi ý ảnh**
