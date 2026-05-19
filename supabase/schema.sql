create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  email text not null,
  name text,
  role text default 'member',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  project_name text not null,
  brand_name text not null,
  current_site_url text,
  target_site_url text,
  current_platform text,
  status text default 'in_progress',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists migration_diagnostics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  complexity_score integer,
  summary text,
  risk_flags jsonb default '[]'::jsonb,
  checklist jsonb default '[]'::jsonb,
  approval_status text default 'pending_review',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists website_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  page_type text,
  structure jsonb default '{}'::jsonb,
  approval_status text default 'pending_review',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  external_product_id text,
  name text not null,
  category text,
  price numeric,
  source_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists detail_page_generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  generation jsonb default '{}'::jsonb,
  approval_status text default 'pending_review',
  risk_level text default 'low',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ai_cs_policies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  policy jsonb default '{}'::jsonb,
  approval_status text default 'pending_review',
  risk_level text default 'medium',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists marketing_scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  script_name text not null,
  status text default 'not_started',
  events jsonb default '[]'::jsonb,
  guide jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payment_recommendations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  recommendation jsonb default '{}'::jsonb,
  approval_status text default 'pending_review',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists approval_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  item_type text not null,
  title text not null,
  summary text,
  approval_status text default 'pending_review',
  risk_level text default 'low',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  actor text,
  action text not null,
  target text,
  previous_status text,
  next_status text,
  risk_level text,
  failure_reason text,
  api_status text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists commerce_connections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  provider_name text not null,
  status text default 'not_connected',
  credentials_ref text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists products_project_external_unique
  on products(project_id, external_product_id)
  where external_product_id is not null;

create table if not exists onsite_installations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  public_key text not null,
  mall_id text not null,
  status text default 'active',
  allowed_origins jsonb default '[]'::jsonb,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(public_key, mall_id)
);

create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  external_review_id text,
  external_product_id text,
  rating numeric,
  title text,
  content text not null,
  sentiment text default 'positive',
  source text default 'cafe24',
  source_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  installation_id uuid references onsite_installations(id) on delete cascade,
  visitor_id text not null,
  session_id text not null,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb,
  unique(installation_id, session_id)
);

create table if not exists onsite_events (
  id uuid primary key default gen_random_uuid(),
  installation_id uuid references onsite_installations(id) on delete cascade,
  session_id text not null,
  visitor_id text not null,
  event_name text not null,
  page_url text,
  product_context jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists chat_sessions (
  id text primary key,
  installation_id uuid references onsite_installations(id) on delete cascade,
  session_id text not null,
  visitor_id text not null,
  product_context jsonb default '{}'::jsonb,
  started_at timestamptz default now(),
  last_message_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_session_id text references chat_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists ai_recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  installation_id uuid references onsite_installations(id) on delete cascade,
  session_id text not null,
  visitor_id text not null,
  surface text not null,
  product_context jsonb default '{}'::jsonb,
  output jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- TODO: Enable RLS for production.
-- alter table organizations enable row level security;
-- alter table users enable row level security;
-- alter table projects enable row level security;
-- alter table migration_diagnostics enable row level security;
-- alter table website_pages enable row level security;
-- alter table products enable row level security;
-- alter table detail_page_generations enable row level security;
-- alter table ai_cs_policies enable row level security;
-- alter table marketing_scripts enable row level security;
-- alter table payment_recommendations enable row level security;
-- alter table approval_items enable row level security;
-- alter table audit_logs enable row level security;
-- alter table commerce_connections enable row level security;
-- alter table onsite_installations enable row level security;
-- alter table product_reviews enable row level security;
-- alter table visitor_sessions enable row level security;
-- alter table onsite_events enable row level security;
-- alter table chat_sessions enable row level security;
-- alter table chat_messages enable row level security;
-- alter table ai_recommendation_logs enable row level security;
