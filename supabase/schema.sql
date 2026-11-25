-- OffCams schema. Run in Supabase: SQL Editor -> New query -> paste -> Run.
create table if not exists students (
  id text primary key, name text not null, student_no text not null,
  college text not null, department text not null, created_at timestamptz default now()
);
create table if not exists trips (
  id text primary key, code text unique not null, title text not null, destination text not null,
  purpose text, ingress date not null, egress date not null, days jsonb not null default '[]',
  delegate_ids text[] not null default '{}', created_by text references students(id), created_at timestamptz default now()
);
create table if not exists checkins (
  id text primary key, trip_id text references trips(id) on delete cascade, student_id text references students(id),
  lat double precision not null, lng double precision not null, accuracy int, photo_url text, note text,
  day int, leg_id text, leg_label text, created_at timestamptz default now()
);
create index if not exists checkins_trip_idx on checkins(trip_id, created_at desc);

-- Realtime for the staff map
alter publication supabase_realtime add table checkins, trips, students;

-- Photo storage
insert into storage.buckets (id, name, public) values ('checkin-photos', 'checkin-photos', true) on conflict do nothing;

-- shortcut: open policies so the first version works without login; replace with Supabase Auth + per-user policies before real use.
alter table students enable row level security;
alter table trips enable row level security;
alter table checkins enable row level security;
create policy "open read students" on students for select using (true);
create policy "open write students" on students for insert with check (true);
create policy "open update students" on students for update using (true);
create policy "open read trips" on trips for select using (true);
create policy "open write trips" on trips for insert with check (true);
create policy "open update trips" on trips for update using (true);
create policy "open read checkins" on checkins for select using (true);
create policy "open insert checkins" on checkins for insert with check (true);
create policy "open upload photos" on storage.objects for insert with check (bucket_id = 'checkin-photos');

-- Newer Supabase projects don't grant table access to the API roles automatically.
grant usage on schema public to anon, authenticated;
grant select, insert, update on students, trips to anon, authenticated;
grant select, insert on checkins to anon, authenticated;
