# Quyền truy cập (trial / paid)

Chạy trong Supabase → SQL Editor:

```sql
alter table user_profiles
  add column if not exists access_level text default 'trial',
  add column if not exists plan text default 'free',
  add column if not exists paid_until timestamptz,
  add column if not exists batch_used boolean default false;

comment on column user_profiles.access_level is 'trial | paid | blocked';
comment on column user_profiles.plan is 'free | starter | standard | daily';
```

## Kích hoạt khách đã trả tiền (tay)

```sql
update user_profiles
set
  access_level = 'paid',
  plan = 'standard',  -- starter=3 | standard=5 | daily=7
  paid_until = now() + interval '30 days',
  updated_at = now()
where id = 'USER_UUID_Ở_ĐÂY';
```

## Chặn user

```sql
update user_profiles
set access_level = 'blocked', updated_at = now()
where id = 'USER_UUID';
```

## Ý nghĩa

| access_level | Quyền |
|--------------|--------|
| trial | Onboarding, profile, lộ trình, **1 batch** bài đầu. **Không** cron |
| paid | Full + cron theo plan |
| blocked | Không gọi AI soạn bài |

Mặc định user mới = trial.
