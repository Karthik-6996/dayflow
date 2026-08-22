// src/services/payrollService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockPayroll } from '../mocks/payroll';
import { mockUsers } from '../mocks/users';
import { validateRow } from '../lib/schema.js';
import { calculateIndianSalaryBreakdown } from '../lib/currency';

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
        const base = user?.salary || 1200000;
        const breakdown = calculateIndianSalaryBreakdown(base);
        record = {
          id: `pay-${userId}`,
          user_id: userId,
          base_salary: base,
          deductions: breakdown.annualDeductions,
          net_salary: breakdown.annualNet,
          current_status: "disbursed",
          current_month: "August 2026",
          structure: {
            annualCTC: base,
            monthlyGross: breakdown.monthlyGross,
            monthlyNet: breakdown.monthlyNet,
            earnings: breakdown.earnings,
            deductions: breakdown.deductions
          },
          history: [
            {
              month: "Jun",
              fullMonth: "June 2026",
              calendarDays: 30,
              paidDays: 30,
              lopDays: 0,
              gross: breakdown.monthlyGross,
              deductions: breakdown.deductions.total,
              net: breakdown.monthlyNet,
              status: "disbursed",
              payDate: "2026-06-30",
              utr: "HDFCN26063001255",
              earnings: breakdown.earnings,
              deductionsBreakdown: breakdown.deductions
            },
            {
              month: "Jul",
              fullMonth: "July 2026",
              calendarDays: 31,
              paidDays: 31,
              lopDays: 0,
              gross: breakdown.monthlyGross,
              deductions: breakdown.deductions.total,
              net: breakdown.monthlyNet,
              status: "disbursed",
              payDate: "2026-07-31",
              utr: "HDFCN26073100771",
              earnings: breakdown.earnings,
              deductionsBreakdown: breakdown.deductions
            },
            {
              month: "Aug",
              fullMonth: "August 2026",
              calendarDays: 31,
              paidDays: 31,
              lopDays: 0,
              gross: breakdown.monthlyGross,
              deductions: breakdown.deductions.total,
              net: breakdown.monthlyNet,
              status: "disbursed",
              payDate: "2026-08-31",
              utr: "HDFCN26083100654",
              earnings: breakdown.earnings,
              deductionsBreakdown: breakdown.deductions
            }
          ]
        };
        mockPayroll.push(record);
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
   * Query: supabase.from('payroll').select('*, users(name, department, job_title, employee_id, bank_details)')
   */
  async getAllPayroll(month = "August 2026") {
    if (IS_MOCK) {
      const enriched = mockUsers.map(user => {
        let pay = mockPayroll.find(p => p.user_id === user.id);
        if (!pay) {
          const base = user.salary || 1200000;
          const breakdown = calculateIndianSalaryBreakdown(base);
          pay = {
            id: `pay-${user.id}`,
            user_id: user.id,
            base_salary: base,
            deductions: breakdown.annualDeductions,
            net_salary: breakdown.annualNet,
            current_status: "disbursed",
            current_month: month,
            structure: {
              annualCTC: base,
              monthlyGross: breakdown.monthlyGross,
              monthlyNet: breakdown.monthlyNet,
              earnings: breakdown.earnings,
              deductions: breakdown.deductions
            },
            history: []
          };
          mockPayroll.push(pay);
        }

        // Find specific month history item if exists
        const monthSlip = pay.history?.find(h => h.fullMonth === month) || pay.history?.[pay.history.length - 1];

        return {
          ...pay,
          selectedMonthSlip: monthSlip,
          users: {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            job_title: user.job_title,
            employee_id: user.employee_id,
            profile_pic: user.profile_pic,
            bank_details: user.bank_details || {
              bank_name: "HDFC Bank Ltd",
              account_no: "50100" + Math.floor(10000000 + Math.random() * 90000000),
              ifsc: "HDFC0001234",
              pan: "ABCDE" + Math.floor(1000 + Math.random() * 9000) + "F",
              uan: "100" + Math.floor(100000000 + Math.random() * 900000000)
            }
          }
        };
      });

      return { data: enriched, error: null };
    }

    const { data, error } = await supabase
      .from('payroll')
      .select('*, users(id, name, email, department, job_title, employee_id, profile_pic)');

    return { data, error };
  },

  /**
   * Update employee payroll (Admin only)
   */
  async updatePayroll(userId, { base_salary, deductions, customBreakdown }) {
    const base = Number(base_salary);
    const breakdown = calculateIndianSalaryBreakdown(base);
    const ded = deductions !== undefined ? Number(deductions) : breakdown.annualDeductions;
    const net = base - ded;

    if (IS_MOCK) {
      let record = mockPayroll.find(p => p.user_id === userId);
      if (record) {
        record.base_salary = base;
        record.deductions = ded;
        record.net_salary = net;
        record.structure = {
          annualCTC: base,
          monthlyGross: Math.round(base / 12),
          monthlyNet: Math.round(net / 12),
          earnings: customBreakdown?.earnings || breakdown.earnings,
          deductions: customBreakdown?.deductions || breakdown.deductions
        };
        // Update history entries with the new structure for ongoing months
        if (record.history && record.history.length > 0) {
          const last = record.history[record.history.length - 1];
          last.gross = Math.round(base / 12);
          last.net = Math.round(net / 12);
          last.deductions = Math.round(ded / 12);
          last.earnings = customBreakdown?.earnings || breakdown.earnings;
          last.deductionsBreakdown = customBreakdown?.deductions || breakdown.deductions;
        }
      } else {
        record = {
          id: `pay-${Date.now()}`,
          user_id: userId,
          base_salary: base,
          deductions: ded,
          net_salary: net,
          current_status: "disbursed",
          current_month: "August 2026",
          structure: {
            annualCTC: base,
            monthlyGross: Math.round(base / 12),
            monthlyNet: Math.round(net / 12),
            earnings: customBreakdown?.earnings || breakdown.earnings,
            deductions: customBreakdown?.deductions || breakdown.deductions
          },
          history: []
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
   * Process monthly batch payroll run
   */
  async processMonthlyPayroll(monthName, { remarks = '', includeBonus = 0 } = {}) {
    if (IS_MOCK) {
      const updatedList = mockPayroll.map(record => {
        const user = mockUsers.find(u => u.id === record.user_id);
        const base = record.base_salary;
        const breakdown = calculateIndianSalaryBreakdown(base);
        const gross = breakdown.monthlyGross + Number(includeBonus || 0);
        const ded = breakdown.deductions.total;
        const net = gross - ded;

        const existingMonthIdx = record.history.findIndex(h => h.fullMonth === monthName);
        const monthEntry = {
          month: monthName.slice(0, 3),
          fullMonth: monthName,
          calendarDays: 31,
          paidDays: 31,
          lopDays: 0,
          gross,
          deductions: ded,
          net,
          status: "disbursed",
          payDate: new Date().toISOString().split('T')[0],
          utr: `HDFCN${Date.now().toString().slice(-8)}`,
          remarks,
          earnings: {
            ...breakdown.earnings,
            bonus: Number(includeBonus || 0),
            total: gross
          },
          deductionsBreakdown: breakdown.deductions
        };

        if (existingMonthIdx !== -1) {
          record.history[existingMonthIdx] = monthEntry;
        } else {
          record.history.push(monthEntry);
        }

        record.current_status = "disbursed";
        record.current_month = monthName;
        return record;
      });

      return { data: updatedList, error: null };
    }

    return { data: true, error: null };
  },

  /**
   * Export bank payment transfer file in CSV (NEFT/RTGS format)
   */
  exportBankDisbursalCSV(records, monthName = "August 2026") {
    const headers = [
      "Sr No",
      "Employee ID",
      "Beneficiary Name",
      "Bank Name",
      "Account Number",
      "IFSC Code",
      "PAN Number",
      "Net Amount (INR)",
      "Payment Month",
      "Transaction Type",
      "Narration"
    ];

    const rows = records.map((record, index) => {
      const user = record.users || {};
      const bank = user.bank_details || {};
      const netMonthly = record.selectedMonthSlip?.net || Math.round(Number(record.net_salary || 0) / 12);

      return [
        index + 1,
        `"${user.employee_id || 'DF-100' + (index + 1)}"`,
        `"${user.name || 'Employee'}"`,
        `"${bank.bank_name || 'HDFC Bank'}"`,
        `"${bank.account_no || '5010049281749' + index}"`,
        `"${bank.ifsc || 'HDFC0001234'}"`,
        `"${bank.pan || 'ABCDE1234F'}"`,
        netMonthly,
        `"${monthName}"`,
        "NEFT",
        `"Salary Disbursal ${monthName}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Dayflow_Salary_Disbursal_${monthName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Validate payroll record against schema
   */
  validate(record) {
    return validateRow('payroll', record);
  }
};
