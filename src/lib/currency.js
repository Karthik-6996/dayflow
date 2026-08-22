// src/lib/currency.js
/**
 * Utility functions for Indian Rupee (INR) formatting, calculations, and conversions.
 */

/**
 * Format a number as Indian Rupee (e.g., ₹12,50,000 or ₹85,400)
 * @param {number|string} amount
 * @param {object} options
 * @returns {string}
 */
export function formatINR(amount, options = {}) {
  const num = Number(amount) || 0;
  const {
    showSymbol = true,
    compact = false,
    maximumFractionDigits = 0,
    minimumFractionDigits = 0
  } = options;

  if (compact) {
    if (Math.abs(num) >= 10000000) {
      return `${showSymbol ? '₹' : ''}${(num / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 100000) {
      return `${showSymbol ? '₹' : ''}${(num / 100000).toFixed(2)} L`;
    }
    if (Math.abs(num) >= 1000) {
      return `${showSymbol ? '₹' : ''}${(num / 1000).toFixed(1)} K`;
    }
  }

  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits,
    minimumFractionDigits
  });

  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Convert a numerical amount into Indian currency words
 * e.g., 85400 -> "Rupees Eighty-Five Thousand Four Hundred Only"
 * @param {number|string} amount
 * @returns {string}
 */
export function numberToINRWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Rupees Zero Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 10) return units[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]}${unit ? ' ' + units[unit] : ''}`;
  }

  function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let res = '';
    if (hundred > 0) {
      res += `${units[hundred]} Hundred`;
      if (remainder > 0) res += ' ';
    }
    if (remainder > 0) {
      res += convertTwoDigits(remainder);
    }
    return res;
  }

  let crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  let hundreds = remainder % 1000;

  let words = [];

  if (crore > 0) {
    words.push(`${convertTwoDigits(crore)} Crore`);
  }
  if (lakh > 0) {
    words.push(`${convertTwoDigits(lakh)} Lakh`);
  }
  if (thousand > 0) {
    words.push(`${convertTwoDigits(thousand)} Thousand`);
  }
  if (hundreds > 0) {
    words.push(convertThreeDigits(hundreds));
  }

  return `Rupees ${words.join(' ')} Only`;
}

/**
 * Standard Indian CTC breakdown calculator
 * Basic: 50%
 * HRA: 25%
 * Special Allowance: 15%
 * Conveyance & Medical: 10%
 * 
 * Deductions:
 * EPF (Employee Provident Fund): 12% of basic (or capped at ₹1,800/mo standard if chosen)
 * Professional Tax (PT): ₹200 / month (standard in most Indian states)
 * TDS (Income Tax): approximate standard slab
 * Health/Mediclaim: ₹1,500/mo
 * 
 * @param {number} annualCTC
 * @returns {object}
 */
export function calculateIndianSalaryBreakdown(annualCTC) {
  const ctc = Math.max(0, Number(annualCTC) || 0);
  const monthlyGross = Math.round(ctc / 12);

  // Monthly Earnings
  const basic = Math.round(monthlyGross * 0.50);
  const hra = Math.round(monthlyGross * 0.25);
  const specialAllowance = Math.round(monthlyGross * 0.15);
  const conveyanceMedical = monthlyGross - (basic + hra + specialAllowance);

  // Monthly Deductions
  // EPF: 12% of Basic or 1800 minimum standard
  const epf = Math.min(Math.round(basic * 0.12), Math.round(basic * 0.12));
  const pt = 200; // standard Indian professional tax
  
  // Approximate TDS (New Tax Regime rough progressive monthly deduction)
  let annualTaxable = Math.max(0, ctc - 75000); // Standard deduction of 75,000
  let annualTds = 0;
  if (annualTaxable > 1500000) {
    annualTds = 150000 + (annualTaxable - 1500000) * 0.30;
  } else if (annualTaxable > 1200000) {
    annualTds = 90000 + (annualTaxable - 1200000) * 0.20;
  } else if (annualTaxable > 1000000) {
    annualTds = 60000 + (annualTaxable - 1000000) * 0.15;
  } else if (annualTaxable > 700000) {
    annualTds = 30000 + (annualTaxable - 700000) * 0.10;
  } else if (annualTaxable > 300000) {
    annualTds = (annualTaxable - 300000) * 0.05;
  }
  // If rebate applies under 7L, TDS is 0
  if (ctc <= 775000) annualTds = 0;
  
  const monthlyTds = Math.round(annualTds / 12);
  const healthInsurance = 1250;

  const totalMonthlyDeductions = epf + pt + monthlyTds + healthInsurance;
  const monthlyNet = Math.max(0, monthlyGross - totalMonthlyDeductions);

  return {
    annualCTC: ctc,
    monthlyGross,
    monthlyNet,
    annualDeductions: totalMonthlyDeductions * 12,
    annualNet: monthlyNet * 12,
    earnings: {
      basic,
      hra,
      specialAllowance,
      conveyanceMedical,
      total: monthlyGross
    },
    deductions: {
      epf,
      pt,
      tds: monthlyTds,
      healthInsurance,
      total: totalMonthlyDeductions
    }
  };
}
