-- Mini Atoms — optional Supabase upgrade schema.
-- V1 ships with localStorage persistence (zero setup). To move to a real
-- server-side database, run this SQL in the Supabase SQL editor, then implement
-- lib/supabase.ts and wire it into the API routes / store.

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initial_prompt text,
  current_code text not null,
  current_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  version_number integer not null,
  prompt text,
  code text not null,
  summary text,
  created_at timestamptz default now()
);

-- Recommended indexes
create index if not exists idx_messages_project on messages(project_id);
create index if not exists idx_versions_project on versions(project_id);
