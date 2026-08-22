-- Dayflow frontend leave integration patch.
-- Run after 002_add_cancelled_leave_status.sql has completed successfully.

create or replace function public.check_leave_overlap(
  p_user_id uuid,
  p_start date,
  p_end date,
  p_exclude_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leave_requests lr
    where lr.user_id = p_user_id
      and lr.status in ('pending', 'approved')
      and lr.start_date <= p_end
      and lr.end_date >= p_start
      and (p_exclude_id is null or lr.id <> p_exclude_id)
  );
$$;

revoke all on function public.check_leave_overlap(uuid, date, date, uuid) from public;
grant execute on function public.check_leave_overlap(uuid, date, date, uuid) to authenticated;

drop policy if exists "leave_requests_cancel_own_pending" on public.leave_requests;
create policy "leave_requests_cancel_own_pending"
  on public.leave_requests
  for update
  to authenticated
  using (user_id = auth.uid() and status = 'pending')
  with check (
    user_id = auth.uid()
    and status = 'cancelled'
    and comments is null
  );
