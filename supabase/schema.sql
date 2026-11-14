create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text,
  city text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.lease_summaries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  filename text not null,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  area text,
  day smallint check (day between 0 and 6),
  assigned_to_name text,
  status text not null default 'open' check (status in ('open','done','flagged')),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.chore_flags (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  chore_id uuid not null references public.chores(id) on delete cascade,
  responsible_label text not null default '',
  note text not null default '',
  is_anonymous boolean not null default true,
  reported_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.shared_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  amount numeric(10,2) not null check (amount > 0),
  paid_by_label text,
  split jsonb not null default '{}'::jsonb,
  recurring boolean not null default false,
  due_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.household_budgets (
  household_id uuid primary key references public.households(id) on delete cascade,
  amounts jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.house_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  text text not null,
  category text not null default 'House',
  status text not null default 'proposed' check (status in ('proposed','active','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.house_details (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  label text not null,
  value text not null,
  sensitivity text not null default 'shared' check (sensitivity in ('shared','owner_only')),
  created_at timestamptz not null default now(),
  unique (household_id, label)
);

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  description text not null,
  note text not null default '',
  status text not null default 'open',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.movein_checklist (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  item_key text not null,
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (household_id, item_key)
);

create table if not exists public.deposit_photos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  storage_path text not null unique,
  room text not null,
  note text not null default '',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  token text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deposit-vault', 'deposit-vault', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

create or replace function public.is_household_member(target_household uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = target_household and user_id = auth.uid()
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.lease_summaries enable row level security;
alter table public.chores enable row level security;
alter table public.chore_flags enable row level security;
alter table public.shared_expenses enable row level security;
alter table public.household_budgets enable row level security;
alter table public.house_rules enable row level security;
alter table public.house_details enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.movein_checklist enable row level security;
alter table public.deposit_photos enable row level security;
alter table public.household_invites enable row level security;

create policy "members can read their households" on public.households for select using (public.is_household_member(id));
create policy "members can read household memberships" on public.household_members for select using (public.is_household_member(household_id));
create policy "members can read lease summaries" on public.lease_summaries for select using (public.is_household_member(household_id));
create policy "members can read chores" on public.chores for select using (public.is_household_member(household_id));
create policy "members can read chore flags" on public.chore_flags for select using (public.is_household_member(household_id));
create policy "members can read shared expenses" on public.shared_expenses for select using (public.is_household_member(household_id));
create policy "members can read household budgets" on public.household_budgets for select using (public.is_household_member(household_id));
create policy "members can read house rules" on public.house_rules for select using (public.is_household_member(household_id));
create policy "members can read house details" on public.house_details for select using (public.is_household_member(household_id) and (sensitivity = 'shared' or exists (select 1 from public.household_members m where m.household_id = household_details.household_id and m.user_id = auth.uid() and m.role = 'owner')));
create policy "members can read maintenance records" on public.maintenance_records for select using (public.is_household_member(household_id));
create policy "members can read checklist" on public.movein_checklist for select using (public.is_household_member(household_id));
create policy "members can read deposit photos" on public.deposit_photos for select using (public.is_household_member(household_id));
create policy "owners can read invites" on public.household_invites for select using (exists (select 1 from public.household_members m where m.household_id = household_invites.household_id and m.user_id = auth.uid() and m.role = 'owner'));
