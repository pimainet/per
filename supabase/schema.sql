-- Personal Brand AI — schema MVP
-- Chạy trong Supabase SQL Editor

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  data jsonb not null,
  locked boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.style_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  data jsonb not null,
  is_temporary boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  pillar text,
  content text not null,
  note text,
  status text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.user_profiles enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.roadmaps enable row level security;
alter table public.style_profiles enable row level security;
alter table public.drafts enable row level security;
alter table public.memories enable row level security;

create policy "own user_profiles" on public.user_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own brand_profiles" on public.brand_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own roadmaps" on public.roadmaps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own style_profiles" on public.style_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own drafts" on public.drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own memories" on public.memories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
