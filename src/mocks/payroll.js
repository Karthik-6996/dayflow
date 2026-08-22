// src/mocks/payroll.js
import { calculateIndianSalaryBreakdown } from '../lib/currency';

// Generate realistic Indian payroll record for an employee with history
function createEmployeePayroll(id, userId, annualCTC) {
  const breakdown = calculateIndianSalaryBreakdown(annualCTC);
  const monthlyGross = breakdown.monthlyGross;
  const monthlyNet = breakdown.monthlyNet;
  const monthlyDed = breakdown.deductions.total;

  const months = [
    { name: "March 2026", short: "Mar", days: 31, paid: 31, lop: 0, status: "disbursed", payDate: "2026-03-31", utr: "HDFCN26033100812" },
    { name: "April 2026", short: "Apr", days: 30, paid: 30, lop: 0, status: "disbursed", payDate: "2026-04-30", utr: "HDFCN26043001429" },
    { name: "May 2026", short: "May", days: 31, paid: 30, lop: 1, status: "disbursed", payDate: "2026-05-31", utr: "HDFCN26053100984" },
    { name: "June 2026", short: "Jun", days: 30, paid: 30, lop: 0, status: "disbursed", payDate: "2026-06-30", utr: "HDFCN26063001255" },
    { name: "July 2026", short: "Jul", days: 31, paid: 31, lop: 0, status: "disbursed", payDate: "2026-07-31", utr: "HDFCN26073100771" },
    { name: "August 2026", short: "Aug", days: 31, paid: 31, lop: 0, status: "disbursed", payDate: "2026-08-31", utr: "HDFCN26083100654" }
  ];

  const history = months.map(m => {
    // lop deduction if any
    const perDayGross = Math.round(monthlyGross / m.days);
    const lopDeduction = m.lop * perDayGross;
    const actualGross = monthlyGross - lopDeduction;
    const actualNet = actualGross - monthlyDed;

    return {
      month: m.short,
      fullMonth: m.name,
      calendarDays: m.days,
      paidDays: m.paid,
      lopDays: m.lop,
      gross: actualGross,
      deductions: monthlyDed,
      net: actualNet,
      status: m.status,
      payDate: m.payDate,
      utr: m.utr,
      earnings: {
        basic: breakdown.earnings.basic,
        hra: breakdown.earnings.hra,
        specialAllowance: breakdown.earnings.specialAllowance,
        conveyanceMedical: breakdown.earnings.conveyanceMedical,
        bonus: 0,
        total: actualGross
      },
      deductionsBreakdown: {
        epf: breakdown.deductions.epf,
        pt: breakdown.deductions.pt,
        tds: breakdown.deductions.tds,
        healthInsurance: breakdown.deductions.healthInsurance,
        lopDeduction: lopDeduction,
        total: monthlyDed + lopDeduction
      }
    };
  });

  return {
    id,
    user_id: userId,
    base_salary: annualCTC,
    deductions: breakdown.annualDeductions,
    net_salary: breakdown.annualNet,
    current_status: "disbursed", // current cycle status
    current_month: "August 2026",
    structure: {
      annualCTC,
      monthlyGross,
      monthlyNet,
      earnings: breakdown.earnings,
      deductions: breakdown.deductions
    },
    history
  };
}

export const mockPayroll = [
  createEmployeePayroll("pay-001", "usr-001-emp", 1450000), // Sarah Jenkins ₹14.5 LPA
  createEmployeePayroll("pay-002", "usr-002-adm", 2400000), // Alex Rivera ₹24.0 LPA
  createEmployeePayroll("pay-003", "usr-003-emp", 1650000), // Marcus Chen ₹16.5 LPA
  createEmployeePayroll("pay-004", "usr-004-emp", 2250000), // Priya Sharma ₹22.5 LPA
  createEmployeePayroll("pay-005", "usr-005-emp", 1100000), // David Kim ₹11.0 LPA
  createEmployeePayroll("pay-006", "usr-006-adm", 2600000), // Elena Rostova ₹26.0 LPA
];
