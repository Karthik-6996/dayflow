// src/pages/admin/PayrollManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import {
  TrendingDown,
  CreditCard,
  Edit2,
  Search,
  DollarSign,
  Trash2,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export const PayrollManagementPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [removeModalItem, setRemoveModalItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const { data, error } = await payrollService.getAllPayroll();
      if (error) toast.error("Error loading payroll records");
      setPayrolls(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollData();
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await payrollService.updatePayroll(editItem.user_id, {
        base_salary: Number(editItem.base_salary),
        deductions: Number(editItem.deductions)
      });
      if (error) {
        toast.error("Failed to update salary");
      } else {
        toast.success("Salary updated successfully");
        setEditItem(null);
        await loadPayrollData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeModalItem) return;
    setSaving(true);
    try {
      await payrollService.removeEmployeeFromPayroll(removeModalItem.user_id);
      toast.success(`${removeModalItem.users?.name || 'Employee'} removed from payroll operations.`);
      setRemoveModalItem(null);
      await loadPayrollData();
    } catch (e) {
      toast.error("Failed to remove employee");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPayrollList = async () => {
    localStorage.removeItem('dayflow_removed_payroll_ids');
    toast.success("Payroll list reset to default active employees.");
    await loadPayrollData();
  };

  const filteredPayrolls = payrolls.filter((p) => {
    const name = p.users?.name || '';
    const dept = p.users?.department || '';
    const id = p.users?.employee_id || '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || dept.toLowerCase().includes(q) || id.toLowerCase().includes(q);
  });

  const totalMonthlyGross = payrolls.reduce((acc, curr) => acc + Math.round(Number(curr.base_salary || 0) / 12), 0);
  const totalMonthlyDeductions = payrolls.reduce((acc, curr) => acc + Math.round(Number(curr.deductions || 0) / 12), 0);
  const totalMonthlyNet = totalMonthlyGross - totalMonthlyDeductions;

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Payroll Administration</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure employee wage structures, automated component calculations, and statutory deductions
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetPayrollList}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer self-start"
          title="Restore all active employees to payroll"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restore Employee List
        </button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Monthly Disbursal"
          value={`₹${totalMonthlyGross.toLocaleString()}`}
          subtitle="Gross monthly wage commitment"
          icon={DollarSign}
        />
        <StatCard
          title="Statutory Deductions"
          value={`₹${totalMonthlyDeductions.toLocaleString()}`}
          subtitle="Provident Fund (12%) & Prof Tax"
          icon={TrendingDown}
        />
        <StatCard
          title="Net Take-Home Total"
          value={`₹${totalMonthlyNet.toLocaleString()}`}
          subtitle="Final employee monthly transfer"
          icon={CreditCard}
        />
      </div>

      {/* Payroll Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Active Staff Salary Profiles ({payrolls.length} Employees)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live salary breakdown with automatic statutory formulas (unwanted & non-logged accounts removed)
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-xs">Loading records...</div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">No payroll records found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Monthly Wage</TableHead>
                <TableHead>Yearly CTC</TableHead>
                <TableHead>Monthly Deductions (PF/Tax)</TableHead>
                <TableHead>Net Monthly Payout</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrolls.map((row) => (
                <TableRow key={row.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={row.users?.name} size="sm" />
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white text-xs">{row.users?.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{row.users?.employee_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                    {row.users?.department || 'Operations'}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                    ₹{Math.round(row.base_salary / 12).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    ₹{row.base_salary.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-rose-600 dark:text-rose-400">
                    -₹{Math.round(row.deductions / 12).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{row.monthly_net ? row.monthly_net.toLocaleString() : Math.round(row.net_salary / 12).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditItem(row)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition cursor-pointer"
                        title="Configure Salary & Components"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRemoveModalItem(row)}
                        className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-700 transition cursor-pointer"
                        title="Remove Employee from Payroll"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit Salary Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Adjust Employee Salary"
        subtitle={`Editing wage structure for ${editItem?.users?.name}`}
      >
        {editItem && (
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Annual CTC (₹ INR) *
              </label>
              <input
                type="number"
                required
                min="10000"
                step="10000"
                value={editItem.base_salary}
                onChange={(e) => setEditItem({ ...editItem, base_salary: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Calculated Monthly Wage:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  ₹{Math.round(editItem.base_salary / 12).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Basic Salary (50%):</span>
                <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                  ₹{Math.round((editItem.base_salary / 12) * 0.5).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">HRA (50% of Basic):</span>
                <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                  ₹{Math.round((editItem.base_salary / 12) * 0.25).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">PF (12% of Basic):</span>
                <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                  -₹{Math.round((editItem.base_salary / 12) * 0.5 * 0.12).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold cursor-pointer"
              >
                {saving ? 'Updating...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Remove Employee Confirmation Modal */}
      <Modal
        isOpen={!!removeModalItem}
        onClose={() => setRemoveModalItem(null)}
        title="Remove Employee from Payroll"
        subtitle={`Action for ${removeModalItem?.users?.name} (${removeModalItem?.users?.employee_id})`}
      >
        {removeModalItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Are you sure you want to remove this employee from active payroll?</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  This employee will be excluded from monthly wage disbursals and payroll reports. You can restore them anytime using the 'Restore Employee List' button.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setRemoveModalItem(null)}
                className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
              >
                Keep in Payroll
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmRemove}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer transition"
              >
                {saving ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

