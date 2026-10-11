-- À coller dans Supabase > SQL Editor > Run (peut être relancé sans danger).
do $$
declare t text;
begin
  foreach t in array array['events','projects','tasks','ideas'] loop
    execute format('create table if not exists public.app_%s (id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade, data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now())', t);
    execute format('create index if not exists app_%s_owner on public.app_%s (owner_id)', t, t);
    execute format('alter table public.app_%s enable row level security', t);
    execute format('revoke all on public.app_%s from anon', t);
    execute format('drop policy if exists "owner only" on public.app_%s', t);
    execute format('create policy "owner only" on public.app_%s for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;
