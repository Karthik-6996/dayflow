-- Dayflow HRMS initial Supabase schema.
-- Apply from the Supabase SQL editor or with:
--   supabase db push

create extension if not exists "pgcrypto";
create extension if not exists "citext";

do $$
begin
  create type public.app_role as enum ('employee', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.attendance_status as enum ('present', 'absent', 'half-day', 'leave');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.leave_type as enum ('paid', 'sick', 'unpaid');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.request_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id text not null unique,
  email citext not null unique,
  role public.app_role not null default 'employee',
  name text not null default '',
  phone text,
  address text,
  job_title text,
  department text,
  salary numeric(12, 2) not null default 0 check (salary >= 0),
  profile_pic text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  check_in_time timestamptz,
  check_out_time timestamptz,
  status public.attendance_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_one_row_per_user_day unique (user_id, date),
  constraint attendance_checkout_after_checkin check (
    check_out_time is null
    or check_in_time is null
    or check_out_time >= check_in_time
  )
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type public.leave_type not null,
  start_date date not null,
  end_date date not null,
  remarks text,
  status public.request_status not null default 'pending',
  comments text,
  decided_by uuid references public.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_requests_valid_range check (end_date >= start_date)
);

create table if not exists public.payroll (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  base_salary numeric(12, 2) not null default 0 check (base_salary >= 0),
  deductions numeric(12, 2) not null default 0 check (deductions >= 0),
  net_salary numeric(12, 2) generated always as (base_salary - deductions) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_net_salary_non_negative check (base_salary >= deductions)
);

create index if not exists users_role_idx on public.users(role);
create index if not exists attendance_user_date_idx on public.attendance(user_id, date desc);
create index if not exists attendance_date_idx on public.attendance(date desc);
create index if not exists leave_requests_user_created_idx on public.leave_requests(user_id, created_at desc);
create index if not exists leave_requests_status_created_idx on public.leave_requests(status, created_at desc);
create index if not exists payroll_user_idx on public.payroll(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = check_user_id
      and u.role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_employee_id text;
  requested_name text;
  requested_role public.app_role;
begin
  requested_employee_id := coalesce(nullif(trim(new.raw_user_meta_data ->> 'employee_id'), ''), 'DF-' || floor(1000 + random() * 9000)::text);
  requested_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1));
  requested_role := case 
    when (new.raw_user_meta_data ->> 'role') = 'admin' then 'admin'::public.app_role 
    else 'employee'::public.app_role 
  end;

  insert into public.users (id, employee_id, email, role, name)
  values (
    new.id,
    requested_employee_id,
    new.email,
    requested_role,
    requested_name
  )
  on conflict (id) do update
    set email = excluded.email,
        role = coalesce(public.users.role, excluded.role),
        name = case when public.users.name = '' then excluded.name else public.users.name end,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.protect_user_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin(auth.uid()) then
    return new;
  end if;

  if old.id <> auth.uid() then
    raise exception 'employees can update only their own profile';
  end if;

  if new.id is distinct from old.id
    or new.employee_id is distinct from old.employee_id
    or new.email is distinct from old.email
    or new.role is distinct from old.role
    or new.name is distinct from old.name
    or new.job_title is distinct from old.job_title
    or new.department is distinct from old.department
    or new.salary is distinct from old.salary then
    raise exception 'employees may update only phone, address, and profile_pic';
  end if;

  return new;
end;
$$;

create or replace function public.protect_attendance_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin(auth.uid()) then
    return new;
  end if;

  if old.user_id <> auth.uid() then
    raise exception 'employees can update only their own attendance';
  end if;

  if new.id is distinct from old.id
    or new.user_id is distinct from old.user_id
    or new.date is distinct from old.date
    or new.check_in_time is distinct from old.check_in_time
    or new.status is distinct from old.status then
    raise exception 'employees may update only check_out_time';
  end if;

  return new;
end;
$$;

create or replace function public.prepare_leave_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('approved', 'rejected') and old.status is distinct from new.status then
    new.decided_by = auth.uid();
    new.decided_at = now();
  end if;

  if new.status = 'pending' then
    new.decided_by = null;
    new.decided_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists users_protect_profile_update on public.users;
create trigger users_protect_profile_update
  before update on public.users
  for each row execute function public.protect_user_profile_update();

drop trigger if exists attendance_set_updated_at on public.attendance;
create trigger attendance_set_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

drop trigger if exists attendance_protect_update on public.attendance;
create trigger attendance_protect_update
  before update on public.attendance
  for each row execute function public.protect_attendance_update();

drop trigger if exists leave_requests_set_updated_at on public.leave_requests;
create trigger leave_requests_set_updated_at
  before update on public.leave_requests
  for each row execute function public.set_updated_at();

drop trigger if exists leave_requests_prepare_decision on public.leave_requests;
create trigger leave_requests_prepare_decision
  before update on public.leave_requests
  for each row execute function public.prepare_leave_decision();

drop trigger if exists payroll_set_updated_at on public.payroll;
create trigger payroll_set_updated_at
  before update on public.payroll
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_requests enable row level security;
alter table public.payroll enable row level security;

drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin"
  on public.users
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "users_insert_own_employee_profile" on public.users;
create policy "users_insert_own_employee_profile"
  on public.users
  for insert
  to authenticated
  with check (id = auth.uid() and role = 'employee');

drop policy if exists "users_update_own_or_admin" on public.users;
create policy "users_update_own_or_admin"
  on public.users
  for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "users_delete_admin" on public.users;
create policy "users_delete_admin"
  on public.users
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "attendance_select_own_or_admin" on public.attendance;
create policy "attendance_select_own_or_admin"
  on public.attendance
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "attendance_insert_own_or_admin" on public.attendance;
create policy "attendance_insert_own_or_admin"
  on public.attendance
  for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "attendance_update_own_or_admin" on public.attendance;
create policy "attendance_update_own_or_admin"
  on public.attendance
  for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "attendance_delete_admin" on public.attendance;
create policy "attendance_delete_admin"
  on public.attendance
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "leave_requests_select_own_or_admin" on public.leave_requests;
create policy "leave_requests_select_own_or_admin"
  on public.leave_requests
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "leave_requests_insert_own_pending" on public.leave_requests;
create policy "leave_requests_insert_own_pending"
  on public.leave_requests
  for insert
  to authenticated
  with check (
    (user_id = auth.uid() and status = 'pending' and comments is null)
    or public.is_admin()
  );

drop policy if exists "leave_requests_update_admin" on public.leave_requests;
create policy "leave_requests_update_admin"
  on public.leave_requests
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "leave_requests_delete_admin" on public.leave_requests;
create policy "leave_requests_delete_admin"
  on public.leave_requests
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "payroll_select_own_or_admin" on public.payroll;
create policy "payroll_select_own_or_admin"
  on public.payroll
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "payroll_insert_admin" on public.payroll;
create policy "payroll_insert_admin"
  on public.payroll
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "payroll_update_admin" on public.payroll;
create policy "payroll_update_admin"
  on public.payroll
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "payroll_delete_admin" on public.payroll;
create policy "payroll_delete_admin"
  on public.payroll
  for delete
  to authenticated
  using (public.is_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.users to authenticated;
grant select, insert, update, delete on public.attendance to authenticated;
grant select, insert, update, delete on public.leave_requests to authenticated;
grant select, insert, update, delete on public.payroll to authenticated;
