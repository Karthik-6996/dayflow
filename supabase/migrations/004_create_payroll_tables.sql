-- Migration: 004_create_payroll_tables.sql
-- Create salary_profiles and payroll_disbursals tables with complete RLS policies

-- 1. Create salary_profiles table
CREATE TABLE IF NOT EXISTS public.salary_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  wage_type TEXT NOT NULL DEFAULT 'Fixed Wage',
  monthly_wage NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_wage >= 0),
  yearly_wage NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (yearly_wage >= 0),
  working_days_per_week INT NOT NULL DEFAULT 5 CHECK (working_days_per_week BETWEEN 1 AND 7),
  break_time_mins INT NOT NULL DEFAULT 60 CHECK (break_time_mins >= 0),
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  statutory JSONB NOT NULL DEFAULT '{"pf_enabled": true, "pf_rate": 12, "professional_tax": 200}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create payroll_disbursals table (for immutable monthly pay slips / snapshots)
CREATE TABLE IF NOT EXISTS public.payroll_disbursals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pay_period TEXT NOT NULL, -- e.g. '2026-08'
  monthly_wage NUMERIC(12, 2) NOT NULL DEFAULT 0,
  attendance_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,
  statutory_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_payable NUMERIC(12, 2) NOT NULL DEFAULT 0,
  breakdown_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'processed' | 'disbursed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pay_period)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.salary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_disbursals ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any previous policies on these tables
DROP POLICY IF EXISTS "Employees can view own salary profile" ON public.salary_profiles;
DROP POLICY IF EXISTS "Admins have full access to salary profiles" ON public.salary_profiles;
DROP POLICY IF EXISTS "Employees can view own payroll slips" ON public.payroll_disbursals;
DROP POLICY IF EXISTS "Admins have full access to payroll disbursals" ON public.payroll_disbursals;

-- 5. RLS Policies using explicit auth.uid() parameter for public.is_admin(uuid)
-- Employees: Read-Only for their own record
CREATE POLICY "Employees can view own salary profile"
ON public.salary_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Employees can view own payroll slips"
ON public.payroll_disbursals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins: Full control (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins have full access to salary profiles"
ON public.salary_profiles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to payroll disbursals"
ON public.payroll_disbursals
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 6. Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_disbursals TO authenticated;
