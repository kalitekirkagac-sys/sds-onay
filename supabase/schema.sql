-- =============================================
-- Kalite Onay Sistemi - Supabase Şeması
-- Supabase > SQL Editor'e yapıştırıp çalıştırın
-- =============================================

-- Kişiler (hekimler)
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  ad_soyad text not null,
  unvan text,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- Aylık içerikler (zengin metin / analiz / karar metinleri)
create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  baslik text not null,
  donem text,                       -- örn: 2026-09
  html text not null default '',
  yayinda boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tokenlar (her kişi + her içerik için tekil link)
create table if not exists public.tokens (
  token text primary key,
  person_id uuid not null references public.people(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  son_gecerlilik date,
  ilk_acilis timestamptz,
  created_at timestamptz not null default now()
);

-- Onaylar
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  onay_durumu text not null default 'ONAYLANDI',
  onay_zamani timestamptz not null default now(),
  dogrulama_kodu text not null unique,
  unique (person_id, content_id)
);

-- Güvenlik: Tablolara sadece sunucu (service role) erişebilir.
alter table public.people    enable row level security;
alter table public.contents  enable row level security;
alter table public.tokens    enable row level security;
alter table public.approvals enable row level security;
