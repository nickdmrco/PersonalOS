-- Dead Reckoning — initial schema
-- Multi-tenant from commit one: every table carries user_id and is guarded by RLS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- Mirror new auth users into profiles.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- dreams
create table if not exists public.dreams (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  body       text not null default '',
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- goals
create table if not exists public.goals (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  dream_id            uuid references public.dreams(id) on delete set null,
  title               text not null,
  done_when           text not null default '',
  target              numeric,
  current             numeric not null default 0,
  unit                text not null default '',
  quarter             text not null,
  archived            boolean not null default false,
  created_at          timestamptz not null default now(),
  progress_updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- tasks
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  goal_id      uuid references public.goals(id) on delete set null,
  title        text not null,
  status       text not null default 'open' check (status in ('open','done')),
  due          date,
  focus        boolean not null default false,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- ---------------------------------------------------------------- inbox
create table if not exists public.inbox_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- journal
create table if not exists public.journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  entry      text not null default '',
  wins       text not null default '',
  friction   text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

-- ---------------------------------------------------------------- rules
create table if not exists public.rules (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text not null,
  origin     text not null default '',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- reviews
create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  week_of         date not null,
  notes           text not null default '',
  completed_count integer not null default 0,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------- indexes
create index if not exists dreams_user_idx      on public.dreams(user_id);
create index if not exists goals_user_idx       on public.goals(user_id, quarter);
create index if not exists tasks_user_idx       on public.tasks(user_id, status);
create index if not exists tasks_completed_idx  on public.tasks(user_id, completed_at desc);
create index if not exists inbox_user_idx       on public.inbox_items(user_id, created_at desc);
create index if not exists journal_user_idx     on public.journal_entries(user_id, entry_date desc);
create index if not exists rules_user_idx       on public.rules(user_id, active);
create index if not exists reviews_user_idx     on public.reviews(user_id, week_of desc);

-- ---------------------------------------------------------------- RLS
-- Nothing is readable or writable except by its owner. This is the whole
-- security model; do not add a service-role path to user data without a reason.
do $$
declare t text;
begin
  foreach t in array array['profiles','dreams','goals','tasks','inbox_items','journal_entries','rules','reviews']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
  end loop;
end $$;

create policy profiles_owner on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy dreams_owner on public.dreams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy goals_owner on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tasks_owner on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy inbox_items_owner on public.inbox_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy journal_entries_owner on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rules_owner on public.rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy reviews_owner on public.reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
