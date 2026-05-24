-- Packuptrip v1 schema. Run in Supabase SQL Editor on a fresh project.
-- Idempotent: safe to re-run (drops + recreates).
--
-- After running this:
--   1. Enable Email auth in Supabase Dashboard → Authentication → Providers
--   2. Confirm the `profiles` row trigger fires on signup (test by creating a user)
--   3. Add real data via the host flow once that's wired up
--
-- Conventions:
--   - snake_case column names (Supabase convention)
--   - uuid primary keys via gen_random_uuid()
--   - timestamptz everywhere; default now()
--   - RLS enabled on every table; permissive read for `live` content,
--     strict write rules (owner-only)

-- ──────────────────────────────────────────────────────────────────────────
-- Extensions
-- ──────────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ──────────────────────────────────────────────────────────────────────────
-- Enums
-- ──────────────────────────────────────────────────────────────────────────
do $$ begin
  create type user_role     as enum ('traveller', 'host', 'admin');
  create type package_status as enum ('draft', 'live', 'archived');
  create type trip_status    as enum ('draft', 'pending', 'live', 'completed', 'cancelled');
  create type booking_status as enum ('requested', 'confirmed', 'cancelled', 'refunded');
  create type item_type      as enum ('package', 'trip');
  create type subject_type   as enum ('user', 'package', 'trip');
exception
  when duplicate_object then null;
end $$;

-- ──────────────────────────────────────────────────────────────────────────
-- profiles  (1:1 with auth.users; password lives in auth.users)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text        not null,
  email       text        not null unique,
  avatar_url  text,
  bio         text,
  id_verified boolean     not null default false,
  role        user_role   not null default 'traveller',
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row on signup. Pulls name from user metadata if present.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────────────
-- packages  (Packuptrip Originals)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.packages (
  id            uuid primary key default gen_random_uuid(),
  title         text           not null,
  location      text           not null,
  days          int            not null check (days > 0),
  price         numeric(10, 2) not null check (price >= 0),
  description   text           not null default '',
  images        text[]         not null default '{}',
  spots_total   int            not null check (spots_total > 0),
  spots_left    int            not null check (spots_left >= 0),
  tags          text[]         not null default '{}',
  includes      text[]         not null default '{}',
  itinerary     jsonb          not null default '[]'::jsonb,
  start_date    date           not null,
  status        package_status not null default 'draft',
  rating_avg    numeric(3, 2)  not null default 0 check (rating_avg between 0 and 5),
  review_count  int            not null default 0,
  created_at    timestamptz    not null default now(),
  check (spots_left <= spots_total)
);

create index if not exists packages_status_idx     on public.packages (status);
create index if not exists packages_start_date_idx on public.packages (start_date);
create index if not exists packages_location_idx   on public.packages (location);

-- ──────────────────────────────────────────────────────────────────────────
-- trips  (Community Trips)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.trips (
  id              uuid primary key default gen_random_uuid(),
  host_id         uuid           not null references public.profiles(id) on delete cascade,
  title           text           not null,
  location        text           not null,
  days            int            not null check (days > 0),
  price_per_share numeric(10, 2) not null check (price_per_share >= 0),
  description     text           not null default '',
  images          text[]         not null default '{}',
  spots_total     int            not null check (spots_total > 0),
  spots_left      int            not null check (spots_left >= 0),
  tags            text[]         not null default '{}',
  includes        text[]         not null default '{}',
  itinerary       jsonb          not null default '[]'::jsonb,
  start_date      date           not null,
  status          trip_status    not null default 'draft',
  created_at      timestamptz    not null default now(),
  check (spots_left <= spots_total)
);

create index if not exists trips_status_idx     on public.trips (status);
create index if not exists trips_host_idx       on public.trips (host_id);
create index if not exists trips_start_date_idx on public.trips (start_date);
create index if not exists trips_location_idx   on public.trips (location);

-- ──────────────────────────────────────────────────────────────────────────
-- bookings
--   item_id is a soft FK (no constraint) because it may point at packages
--   or trips depending on item_type. Validate in the application layer.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid           not null references public.profiles(id) on delete cascade,
  item_id      uuid           not null,
  item_type    item_type      not null,
  base_price   numeric(10, 2) not null check (base_price >= 0),
  service_fee  numeric(10, 2) not null default 0 check (service_fee >= 0),
  total        numeric(10, 2) not null check (total >= 0),
  status       booking_status not null default 'requested',
  created_at   timestamptz    not null default now()
);

create index if not exists bookings_user_idx        on public.bookings (user_id);
create index if not exists bookings_item_idx        on public.bookings (item_type, item_id);
create index if not exists bookings_status_idx      on public.bookings (status);

-- ──────────────────────────────────────────────────────────────────────────
-- reviews
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid         not null references public.bookings(id) on delete cascade,
  author_id     uuid         not null references public.profiles(id) on delete cascade,
  subject_id    uuid         not null,
  subject_type  subject_type not null,
  rating        int          not null check (rating between 1 and 5),
  text          text,
  created_at    timestamptz  not null default now(),
  unique (booking_id, author_id, subject_id, subject_type)
);

create index if not exists reviews_subject_idx on public.reviews (subject_type, subject_id);
create index if not exists reviews_author_idx  on public.reviews (author_id);

-- ──────────────────────────────────────────────────────────────────────────
-- message_threads  (1 thread per pair of users, optionally scoped to a trip)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.message_threads (
  id             uuid primary key default gen_random_uuid(),
  participant_a  uuid        not null references public.profiles(id) on delete cascade,
  participant_b  uuid        not null references public.profiles(id) on delete cascade,
  trip_id        uuid        references public.trips(id) on delete set null,
  created_at     timestamptz not null default now(),
  check (participant_a <> participant_b)
);

-- Canonicalize (a,b) and (b,a) into one thread. Two partial indexes because
-- Postgres treats NULL trip_id as distinct in a regular unique index, so we
-- need separate uniqueness rules for trip-scoped vs. trip-less threads.
create unique index if not exists threads_pair_trip_idx
  on public.message_threads (
    least(participant_a, participant_b),
    greatest(participant_a, participant_b),
    trip_id
  )
  where trip_id is not null;

create unique index if not exists threads_pair_only_idx
  on public.message_threads (
    least(participant_a, participant_b),
    greatest(participant_a, participant_b)
  )
  where trip_id is null;

create index if not exists threads_a_idx on public.message_threads (participant_a);
create index if not exists threads_b_idx on public.message_threads (participant_b);

-- ──────────────────────────────────────────────────────────────────────────
-- messages
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid        not null references public.message_threads(id) on delete cascade,
  sender_id  uuid        not null references public.profiles(id) on delete cascade,
  body       text        not null check (length(body) between 1 and 4000),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_idx on public.messages (thread_id, created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- Row-level security
-- ──────────────────────────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.packages        enable row level security;
alter table public.trips           enable row level security;
alter table public.bookings        enable row level security;
alter table public.reviews         enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages        enable row level security;

-- Drop existing policies so this file stays idempotent
do $$ declare r record; begin
  for r in (
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
  ) loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- profiles: anyone signed in can read; users can update only their own row
create policy "profiles_read_all"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- packages: anyone can read `live`; only admins manage (handled out-of-band)
create policy "packages_read_live"
  on public.packages for select
  using (status = 'live' or exists (
    select 1 from public.profiles
     where profiles.id = auth.uid()
       and profiles.role = 'admin'
  ));

create policy "packages_admin_write"
  on public.packages for all
  using (exists (
    select 1 from public.profiles
     where profiles.id = auth.uid()
       and profiles.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles
     where profiles.id = auth.uid()
       and profiles.role = 'admin'
  ));

-- trips: anyone can read `live`; hosts can read/write their own (any status)
create policy "trips_read_live_or_own"
  on public.trips for select
  using (status = 'live' or host_id = auth.uid());

create policy "trips_host_insert"
  on public.trips for insert
  with check (host_id = auth.uid());

create policy "trips_host_update"
  on public.trips for update
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create policy "trips_host_delete"
  on public.trips for delete
  using (host_id = auth.uid());

-- bookings: a user sees only their own bookings; insert must match auth.uid()
create policy "bookings_own_read"
  on public.bookings for select
  using (user_id = auth.uid());

-- bookings: admins can read all (applied via migration after initial schema)
create policy "bookings_admin_read_all"
  on public.bookings for select
  using (exists (
    select 1 from public.profiles
     where profiles.id = auth.uid()
       and profiles.role = 'admin'
  ));

-- bookings: host can read bookings on their own trips (T6.3)
create policy "bookings_host_read"
  on public.bookings for select
  using (
    item_type = 'trip'
    and exists (
      select 1 from public.trips
       where trips.id = item_id
         and trips.host_id = auth.uid()
    )
  );

create policy "bookings_own_insert"
  on public.bookings for insert
  with check (user_id = auth.uid());

create policy "bookings_own_update"
  on public.bookings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- reviews: anyone can read; only the author can write (and only on their booking)
create policy "reviews_read_all"
  on public.reviews for select
  using (true);

create policy "reviews_author_insert"
  on public.reviews for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.bookings
       where bookings.id = booking_id
         and bookings.user_id = auth.uid()
    )
  );

-- message_threads: participants can read/insert
create policy "threads_participants_read"
  on public.message_threads for select
  using (auth.uid() in (participant_a, participant_b));

create policy "threads_participants_insert"
  on public.message_threads for insert
  with check (auth.uid() in (participant_a, participant_b));

-- messages: visible to thread participants; sender must equal auth.uid()
create policy "messages_participants_read"
  on public.messages for select
  using (exists (
    select 1 from public.message_threads t
     where t.id = thread_id
       and auth.uid() in (t.participant_a, t.participant_b)
  ));

create policy "messages_sender_insert"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.message_threads t
       where t.id = thread_id
         and auth.uid() in (t.participant_a, t.participant_b)
    )
  );

create policy "messages_recipient_mark_read"
  on public.messages for update
  using (exists (
    select 1 from public.message_threads t
     where t.id = thread_id
       and auth.uid() in (t.participant_a, t.participant_b)
       and auth.uid() <> sender_id
  ))
  with check (true);

-- ──────────────────────────────────────────────────────────────────────────
-- host_cancel_booking RPC  (T6.3)
-- Atomically cancels a joiner's booking and restores the freed spot.
-- SECURITY DEFINER so it can write bookings even though the host doesn't
-- own the booking row; auth.uid() is still the logged-in host.
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.host_cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking record;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'booking_not_found';
  end if;
  if v_booking.item_type <> 'trip' then
    raise exception 'not_a_trip_booking';
  end if;
  if v_booking.status = 'cancelled' then
    raise exception 'already_cancelled';
  end if;
  if not exists (
    select 1 from public.trips
     where id = v_booking.item_id
       and host_id = auth.uid()
  ) then
    raise exception 'not_authorized';
  end if;
  update public.bookings set status = 'cancelled' where id = p_booking_id;
  update public.trips set spots_left = spots_left + 1 where id = v_booking.item_id;
end;
$$;
