// src/services/payrollService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockPayroll } from '../mocks/payroll';
import { mockUsers } from '../mocks/users';
import { validateRow } from '../lib/schema.js';

export const payrollService = {
  /**
   * Get payroll information for a single user (Employee read-only)
   * Query: supabase.from('payroll').select('*').eq('user_id', userId)
   */
  async getEmployeePayroll(userId) {
    if (IS_MOCK) {
      let record = mockPayroll.find(p => p.user_id === userId);
      if (!record) {
        const user = mockUsers.find(u => u.id === userId);
        const base = user?.salary || 75000;
        const deductions = Math.round(base * 0.12);
        record = {
          id: `pay-${userId}`,
          user_id: userId,
          base_salary: base,
          deductions: deductions,
          net_salary: base - deductions,
          history: [
            { month: "Jun", base, deductions, net: base - deductions },
            { month: "Jul", base, deductions, net: base - deductions },
            { month: "Aug", base, deductions, net: base - deductions }
          ]
        };
      }
      return { data: record, error: null };
    }

    const { data, error } = await supabase
      .from('payroll')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { data, error };
  },

  /**
   * Get all payroll records (Admin view)
   * Query: supabase.from('payroll').select('*, users(name)')
   */
  async getAllPayroll() {
    if (IS_MOCK) {
      const enriched = mockUsers.map(user => {
        let pay = mockPayroll.find(p => p.user_id === user.id);
        if (!pay) {
          const base = user.salary || 75000;
          const deductions = Math.round(base * 0.12);
          pay = {
            id: `pay-${user.id}`,
            user_id: user.id,
            base_salary: base,
            deductions: deductions,
            net_salary: base - deductions
          };
        }
        return {
          ...pay,
          users: {
            name: user.name,
            department: user.department,
            job_title: user.job_title,
            employee_id: user.employee_id
          }
        };
      });

      return { data: enriched, error: null };
    }

    const { data, error } = await supabase
      .from('payroll')
      .select('*, users(name, department, job_title, employee_id)');

    return { data, error };
  },

  /**
   * Update employee payroll (Admin only)
   * Query: supabase.from('payroll').update({base_salary, deductions}).eq('user_id', userId)
   */
  async updatePayroll(userId, { base_salary, deductions }) {
    const base = Number(base_salary);
    const ded = Number(deductions);
    const net = base - ded;

    if (IS_MOCK) {
      let record = mockPayroll.find(p => p.user_id === userId);
      if (record) {
        record.base_salary = base;
        record.deductions = ded;
        record.net_salary = net;
      } else {
        record = {
          id: `pay-${Date.now()}`,
          user_id: userId,
          base_salary: base,
          deductions: ded,
          net_salary: net
        };
        mockPayroll.push(record);
      }

      // Also sync with users salary field
      const userIdx = mockUsers.findIndex(u => u.id === userId);
      if (userIdx !== -1) {
        mockUsers[userIdx].salary = base;
      }

      return { data: record, error: null };
    }

    const { data, error } = await supabase
      .from('payroll')
      .upsert({
        user_id: userId,
        base_salary: base,
        deductions: ded,
        net_salary: net
      })
      .select()
      .single();

    // Also update users.salary in parallel
    if (!error) {
      await supabase.from('users').update({ salary: base }).eq('id', userId);
    }

    return { data, error };
  },

  /**
   * Validate payroll record against schema
   */
  validate(record) {
    return validateRow('payroll', record);
  }
};
