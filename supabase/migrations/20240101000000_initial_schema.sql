-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table users (
  id uuid primary key default uuid_generate_v4(),
  clerk_id text unique not null,
  email text not null,
  name text,
  slug text unique not null,
  timezone text default 'UTC',
  subscription_tier text default 'free' check (subscription_tier in ('free', 'starter', 'pro')),
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Connected Google accounts
create table connected_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  google_account_id text not null,
  email text not null,
  access_token text not null,
  refresh_token text not null,
  expiry_date bigint not null,
  is_default boolean default false,
  created_at timestamptz default now(),
  unique(user_id, google_account_id)
);

create index idx_connected_accounts_user on connected_accounts(user_id);

-- Availability blocks
create table availability (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

create index idx_availability_user on availability(user_id);

-- Meeting types
create table meeting_types (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  slug text not null,
  duration_minutes int not null check (duration_minutes in (15, 30, 45, 60, 90)),
  description text,
  is_default boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(user_id, slug)
);

create index idx_meeting_types_user on meeting_types(user_id);
create index idx_meeting_types_active on meeting_types(user_id, is_active);

-- Bookings
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  host_id uuid references users(id) on delete cascade,
  meeting_type_id uuid references meeting_types(id) on delete restrict,
  guest_name text not null,
  guest_email text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  guest_timezone text not null,
  google_event_id text,
  meet_link text,
  notes text,
  status text default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz default now()
);

create index idx_bookings_host on bookings(host_id, start_time desc);
create index idx_bookings_time on bookings(start_time) where status = 'confirmed';

-- Feedback
create table feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  content text not null,
  archived boolean default false,
  created_at timestamptz default now()
);

create index idx_feedback_archived on feedback(archived, created_at desc);

-- Enable RLS
alter table users enable row level security;
alter table connected_accounts enable row level security;
alter table availability enable row level security;
alter table meeting_types enable row level security;
alter table bookings enable row level security;
alter table feedback enable row level security;

-- RLS Policies

-- Users: read own data, admins read all
create policy "Users select own data" on users
  for select using (
    clerk_id = auth.jwt() ->> 'sub' 
    OR 
    (select is_admin from users where clerk_id = auth.jwt() ->> 'sub')
  );

create policy "Users update own data" on users
  for update using (clerk_id = auth.jwt() ->> 'sub');

-- Connected accounts: private, users manage their own
create policy "Users manage own accounts" on connected_accounts
  for all using (
    user_id in (select id from users where clerk_id = auth.jwt() ->> 'sub')
  );

-- Availability: public read for booking pages, users manage their own
create policy "Anyone can view availability" on availability
  for select using (true);

create policy "Users manage own availability" on availability
  for all using (
    user_id in (select id from users where clerk_id = auth.jwt() ->> 'sub')
  );

-- Meeting types: public read of active types, users manage their own
create policy "Anyone can view active meeting types" on meeting_types
  for select using (is_active = true);

create policy "Users manage own meeting types" on meeting_types
  for all using (
    user_id in (select id from users where clerk_id = auth.jwt() ->> 'sub')
  );

-- Bookings: hosts view their own, public can create
create policy "Hosts view own bookings" on bookings
  for select using (
    host_id in (select id from users where clerk_id = auth.jwt() ->> 'sub')
    OR
    (select is_admin from users where clerk_id = auth.jwt() ->> 'sub')
  );

create policy "Anyone can create bookings" on bookings
  for insert with check (true);

-- Feedback: users submit their own, admins view all
create policy "Users create own feedback" on feedback
  for insert with check (
    user_id in (select id from users where clerk_id = auth.jwt() ->> 'sub')
  );

create policy "Admins view feedback" on feedback
  for select using (
    (select is_admin from users where clerk_id = auth.jwt() ->> 'sub')
  );

create policy "Admins archive feedback" on feedback
  for update using (
    (select is_admin from users where clerk_id = auth.jwt() ->> 'sub')
  );

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on users
  for each row execute function update_updated_at();
