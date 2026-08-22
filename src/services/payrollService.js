// src/services/payrollService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockPayroll } from '../mocks/payroll';
import { mockUsers } from '../mocks/users';
import { validateRow } from '../lib/schema.js';

/**
 * Standard Salary Components Definition
 * Calculation types:
 * - 'percent_wage': Percentage of total monthly wage
 * - 'percent_basic': Percentage of Basic Salary
 * - 'fixed': Fixed monthly currency amount
 */
export const DEFAULT_SALARY_COMPONENTS = [
  { id: 'comp-basic', name: 'Basic Salary', type: 'percent_wage', rate: 50, fixedValue: 0 },
  { id: 'comp-hra', name: 'House Rent Allowance (HRA)', type: 'percent_basic', rate: 50, fixedValue: 0 },
  { id: 'comp-std', name: 'Standard Allowance', type: 'fixed', rate: 0, fixedValue: 4167 },
  { id: 'comp-perf', name: 'Performance Bonus', type: 'percent_wage', rate: 10, fixedValue: 0 },
  { id: 'comp-lta', name: 'Leave Travel Allowance (LTA)', type: 'percent_wage', rate: 5, fixedValue: 0 },
  { id: 'comp-fuel', name: 'Fuel Allowance', type: 'fixed', rate: 0, fixedValue: 2500 },
];

export const STATUTORY_CONFIG = {
  pf_enabled: true,
  pf_rate: 12, // 12% of Basic Salary
  professional_tax: 200 // ₹200 / month
};

/**
 * Automatically compute salary breakdown from monthly wage and component rules
 */
export function calculateSalaryBreakdown(monthlyWage, components = DEFAULT_SALARY_COMPONENTS, statutory = STATUTORY_CONFIG) {
  const wage = Math.max(0, Number(monthlyWage) || 0);

  // 1. Calculate Basic Salary first
  const basicRule = components.find(c => c.id === 'comp-basic') || { type: 'percent_wage', rate: 50 };
  let basicSalary = 0;
  if (basicRule.type === 'percent_wage') {
    basicSalary = Math.round((wage * basicRule.rate) / 100);
  } else if (basicRule.type === 'fixed') {
    basicSalary = basicRule.fixedValue;
  }

  // 2. Calculate remaining components
  const itemized = components.map(comp => {
    let amount = 0;
    if (comp.id === 'comp-basic') {
      amount = basicSalary;
    } else if (comp.type === 'percent_wage') {
      amount = Math.round((wage * comp.rate) / 100);
    } else if (comp.type === 'percent_basic') {
      amount = Math.round((basicSalary * comp.rate) / 100);
    } else if (comp.type === 'fixed') {
      amount = Number(comp.fixedValue) || 0;
    }
    return {
      ...comp,
      calculatedAmount: amount
    };
  });

  const grossEarnings = itemized.reduce((acc, c) => acc + c.calculatedAmount, 0);

  // 3. Deductions: PF (12% of Basic) + Professional Tax
  const pfAmount = statutory.pf_enabled ? Math.round((basicSalary * (statutory.pf_rate || 12)) / 100) : 0;
  const profTax = statutory.professional_tax || 200;
  const totalDeductions = pfAmount + profTax;
  const netTakeHome = Math.max(0, wage - totalDeductions);

  return {
    monthlyWage: wage,
    yearlyWage: wage * 12,
    basicSalary,
    components: itemized,
    grossEarnings,
    pfAmount,
    profTax,
    totalDeductions,
    netTakeHome,
    isExceedingWage: grossEarnings > wage
  };
}

export const payrollService = {
  /**
   * Get salary profile for an employee
   */
  async getEmployeeSalaryProfile(userId) {
    if (IS_MOCK) {
      const user = mockUsers.find(u => u.id === userId || u.employee_id === userId);
      const monthly = user?.salary ? Math.round(user.salary / 12) : 250000;
      const breakdown = calculateSalaryBreakdown(monthly);
      return {
        data: {
          user_id: userId,
          wage_type: 'Fixed Wage',
          monthly_wage: monthly,
          yearly_wage: monthly * 12,
          working_days_per_week: 5,
          break_time_mins: 60,
          statutory: STATUTORY_CONFIG,
          components: DEFAULT_SALARY_COMPONENTS,
          breakdown
        },
        error: null
      };
    }

    try {
      const { data, error } = await supabase
        .from('salary_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return this.getEmployeeSalaryProfile(userId);
      }
      const breakdown = calculateSalaryBreakdown(data.monthly_wage, data.components || DEFAULT_SALARY_COMPONENTS);
      return { data: { ...data, breakdown }, error: null };
    } catch (e) {
      return this.getEmployeeSalaryProfile(userId);
    }
  },

  /**
   * Update employee salary configuration (Admin only)
   */
  async updateSalaryProfile(userId, { monthlyWage, wageType = 'Fixed Wage', workingDays = 5, breakTime = 60, components, statutory }) {
    const breakdown = calculateSalaryBreakdown(monthlyWage, components, statutory);

    if (IS_MOCK) {
      const user = mockUsers.find(u => u.id === userId || u.employee_id === userId);
      if (user) {
        user.salary = monthlyWage * 12;
      }
      return { data: { user_id: userId, monthly_wage: monthlyWage, breakdown }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('salary_profiles')
        .upsert({
          user_id: userId,
          wage_type: wageType,
          monthly_wage: monthlyWage,
          yearly_wage: monthlyWage * 12,
          working_days_per_week: workingDays,
          break_time_mins: breakTime,
          components: components || DEFAULT_SALARY_COMPONENTS,
          statutory: statutory || STATUTORY_CONFIG
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: { user_id: userId, monthly_wage: monthlyWage, breakdown }, error: null };
    }
  },

  async getEmployeePayroll(userId) {
    const profile = await this.getEmployeeSalaryProfile(userId);
    const b = profile.data?.breakdown;
    return {
      data: {
        base_salary: b?.yearlyWage || 90000,
        deductions: (b?.totalDeductions || 2000) * 12,
        net_salary: (b?.netTakeHome || 80000) * 12,
        monthly_net: b?.netTakeHome || 6500,
        breakdown: b
      },
      error: null
    };
  },

  async getAllPayroll() {
    // Get list of removed user IDs from localStorage if available
    let removedIds = [];
    try {
      const stored = localStorage.getItem('dayflow_removed_payroll_ids');
      if (stored) removedIds = JSON.parse(stored);
    } catch (e) {}

    // Only include employee roles (not system admins) and filter out explicitly removed/unwanted employees
    const activeEmployees = mockUsers.filter(u =>
      u.role === 'employee' && !removedIds.includes(u.id) && !removedIds.includes(u.employee_id)
    );

    const list = activeEmployees.map(user => {
      const monthly = user.salary ? Math.round(user.salary / 12) : 100000;
      const b = calculateSalaryBreakdown(monthly);
      return {
        user_id: user.id,
        users: {
          id: user.id,
          name: user.name,
          department: user.department,
          employee_id: user.employee_id,
          email: user.email,
          job_title: user.job_title
        },
        base_salary: monthly * 12,
        deductions: b.totalDeductions * 12,
        net_salary: b.netTakeHome * 12,
        monthly_net: b.netTakeHome,
        breakdown: b
      };
    });
    return { data: list, error: null };
  },

  async removeEmployeeFromPayroll(userId) {
    try {
      const stored = localStorage.getItem('dayflow_removed_payroll_ids');
      const removedIds = stored ? JSON.parse(stored) : [];
      if (!removedIds.includes(userId)) {
        removedIds.push(userId);
        localStorage.setItem('dayflow_removed_payroll_ids', JSON.stringify(removedIds));
      }
      return { data: { success: true }, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async updatePayroll(userId, updates) {
    return this.updateSalaryProfile(userId, { monthlyWage: Math.round((updates.base_salary || 90000) / 12) });
  }
};

