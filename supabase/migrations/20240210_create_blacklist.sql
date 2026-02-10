-- Create blacklist table
create table if not exists public.blacklist (
    email text primary key,
    reason text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.blacklist enable row level security;

-- Admin only policies
create policy "Admins can do everything on blacklist"
on public.blacklist
for all
using (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
);
