-- ══════════════════════════════════════════════════════════════
-- Dayflow — RLS Policies & Helper Functions
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- ── Helper: Check if current user is admin ──────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Helper: Check for overlapping leave dates ───────────────
CREATE OR REPLACE FUNCTION public.check_leave_overlap(
  p_user_id UUID,
  p_start DATE,
  p_end DATE,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM leave_requests
    WHERE user_id = p_user_id
      AND status NOT IN ('cancelled', 'rejected')
      AND start_date <= p_end
      AND end_date >= p_start
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ══════════════════════════════════════════════════════════════
-- RLS Policies for leave_requests
-- ══════════════════════════════════════════════════════════════

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Employees can view their own leave requests
CREATE POLICY "employees_select_own_leaves"
  ON leave_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all leave requests
CREATE POLICY "admins_select_all_leaves"
  ON leave_requests FOR SELECT TO authenticated
  USING (public.is_admin());

-- Employees can insert their own leave requests (must be 'pending')
CREATE POLICY "employees_insert_own_leave"
  ON leave_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Admins can update any leave request (approve/reject)
CREATE POLICY "admins_update_leaves"
  ON leave_requests FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Employees can update their own pending requests (cancel only)
CREATE POLICY "employees_update_own_pending"
  ON leave_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');


-- ══════════════════════════════════════════════════════════════
-- RLS Policies for attendance
-- ══════════════════════════════════════════════════════════════

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Employees can view their own attendance
CREATE POLICY "employees_select_own_attendance"
  ON attendance FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all attendance
CREATE POLICY "admins_select_all_attendance"
  ON attendance FOR SELECT TO authenticated
  USING (public.is_admin());

-- Employees can insert their own attendance (check-in)
CREATE POLICY "employees_insert_own_attendance"
  ON attendance FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Employees can update their own attendance (check-out)
CREATE POLICY "employees_update_own_attendance"
  ON attendance FOR UPDATE TO authenticated
  USING (user_id = auth.uid());


-- ══════════════════════════════════════════════════════════════
-- RLS Policies for users
-- ══════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Everyone can read their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "admins_select_all_users"
  ON users FOR SELECT TO authenticated
  USING (public.is_admin());

-- Users can update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Admins can update any profile
CREATE POLICY "admins_update_users"
  ON users FOR UPDATE TO authenticated
  USING (public.is_admin());
