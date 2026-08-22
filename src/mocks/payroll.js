// src/mocks/payroll.js
// Matches TABLES.payroll schema: id, user_id, base_salary, deductions, net_salary

export const mockPayroll = [
  {
    id: "pay-001",
    user_id: "usr-001-emp",
    base_salary: 92000,
    deductions: 11500,
    net_salary: 80500,
    // Historical trends for UI breakdown charts
    history: [
      { month: "Mar", base: 92000, deductions: 11500, net: 80500 },
      { month: "Apr", base: 92000, deductions: 11500, net: 80500 },
      { month: "May", base: 92000, deductions: 12000, net: 80000 },
      { month: "Jun", base: 92000, deductions: 11500, net: 80500 },
      { month: "Jul", base: 92000, deductions: 11500, net: 80500 },
      { month: "Aug", base: 92000, deductions: 11500, net: 80500 },
    ],
    breakdown: {
      health_insurance: 3500,
      provident_fund: 5500,
      tax_withholding: 2500,
      allowances: {
        housing: 15000,
        transport: 4000,
        special: 8000
      }
    }
  },
  {
    id: "pay-002",
    user_id: "usr-002-adm",
    base_salary: 125000,
    deductions: 18750,
    net_salary: 106250,
    history: [
      { month: "Mar", base: 125000, deductions: 18750, net: 106250 },
      { month: "Apr", base: 125000, deductions: 18750, net: 106250 },
      { month: "May", base: 125000, deductions: 18750, net: 106250 },
      { month: "Jun", base: 125000, deductions: 18750, net: 106250 },
      { month: "Jul", base: 125000, deductions: 18750, net: 106250 },
      { month: "Aug", base: 125000, deductions: 18750, net: 106250 },
    ]
  },
  {
    id: "pay-003",
    user_id: "usr-003-emp",
    base_salary: 105000,
    deductions: 14200,
    net_salary: 90800,
    history: [
      { month: "Mar", base: 105000, deductions: 14200, net: 90800 },
      { month: "Apr", base: 105000, deductions: 14200, net: 90800 },
      { month: "May", base: 105000, deductions: 14200, net: 90800 },
      { month: "Jun", base: 105000, deductions: 14200, net: 90800 },
      { month: "Jul", base: 105000, deductions: 14200, net: 90800 },
      { month: "Aug", base: 105000, deductions: 14200, net: 90800 },
    ]
  },
  {
    id: "pay-004",
    user_id: "usr-004-emp",
    base_salary: 135000,
    deductions: 21000,
    net_salary: 114000,
    history: [
      { month: "Mar", base: 135000, deductions: 21000, net: 114000 },
      { month: "Apr", base: 135000, deductions: 21000, net: 114000 },
      { month: "May", base: 135000, deductions: 21000, net: 114000 },
      { month: "Jun", base: 135000, deductions: 21000, net: 114000 },
      { month: "Jul", base: 135000, deductions: 21000, net: 114000 },
      { month: "Aug", base: 135000, deductions: 21000, net: 114000 },
    ]
  },
  {
    id: "pay-005",
    user_id: "usr-005-emp",
    base_salary: 78000,
    deductions: 9360,
    net_salary: 68640,
    history: [
      { month: "Mar", base: 78000, deductions: 9360, net: 68640 },
      { month: "Apr", base: 78000, deductions: 9360, net: 68640 },
      { month: "May", base: 78000, deductions: 9360, net: 68640 },
      { month: "Jun", base: 78000, deductions: 9360, net: 68640 },
      { month: "Jul", base: 78000, deductions: 9360, net: 68640 },
      { month: "Aug", base: 78000, deductions: 9360, net: 68640 },
    ]
  },
  {
    id: "pay-006",
    user_id: "usr-006-adm",
    base_salary: 140000,
    deductions: 22400,
    net_salary: 117600,
    history: [
      { month: "Mar", base: 140000, deductions: 22400, net: 117600 },
      { month: "Apr", base: 140000, deductions: 22400, net: 117600 },
      { month: "May", base: 140000, deductions: 22400, net: 117600 },
      { month: "Jun", base: 140000, deductions: 22400, net: 117600 },
      { month: "Jul", base: 140000, deductions: 22400, net: 117600 },
      { month: "Aug", base: 140000, deductions: 22400, net: 117600 },
    ]
  }
];
