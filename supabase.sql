create table if not exists public.lolo_backups (
  user_id uuid not null references auth.users(id) on delete cascade,
  profile text not null,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  primary key(user_id, profile)
);
alter table public.lolo_backups enable row level security;
create policy "owner select backup" on public.lolo_backups for select to authenticated using (auth.uid() = user_id);
create policy "owner insert backup" on public.lolo_backups for insert to authenticated with check (auth.uid() = user_id);
create policy "owner update backup" on public.lolo_backups for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner delete backup" on public.lolo_backups for delete to authenticated using (auth.uid() = user_id);
