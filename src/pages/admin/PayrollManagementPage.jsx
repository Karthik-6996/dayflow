// src/pages/admin/PayrollManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatCard } from '../../components/ui/StatCard';
import {
  DollarSign,
  TrendingDown,
  CreditCard,
  Edit2,
  Save,
  CheckCircle2,
  Building,
  Calculator,
  ShieldAlert,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

export const PayrollManagementPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null); // { user_id, name, base_salary, deductions }
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

  const handleEditClick = (record) => {
    setEditItem({
      user_id: record.user_id,
      name: record.users?.name,
      base_salary: record.base_salary,
      deductions: record.deductions
    });
  };

  const handleSavePayroll = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    setSaving(true);
    try {
      const { data, error } = await payrollService.updatePayroll(editItem.user_id, {
        base_salary: editItem.base_salary,
        deductions: editItem.deductions
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success(`Updated payroll for ${editItem.name}!`);
        setEditItem(null);
        await loadPayrollData();
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredPayrolls = payrolls.filter(p => {
    const name = p.users?.name || '';
    const dept = p.users?.department || '';
    const id = p.users?.employee_id || '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || dept.toLowerCase().includes(q) || id.toLowerCase().includes(q);
  });

  const totalBase = payrolls.reduce((acc, curr) => acc + Number(curr.base_salary || 0), 0);
  const totalDeductions = payrolls.reduce((acc, curr) => acc + Number(curr.deductions || 0), 0);
  const totalNet = totalBase - totalDeductions;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll Operations & Salaries</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Admin & HR Ops
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Configure compensation packages, update base wages, and review company deductions</p>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Gross Payroll"
          value={`$${totalBase.toLocaleString()}`}
          subtitle="Annualized corporate commitment"
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Total Statutory Deductions"
          value={`$${totalDeductions.toLocaleString()}`}
          subtitle="Tax & retirement withholdings"
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Net Disbursable Take-Home"
          value={`$${totalNet.toLocaleString()}`}
          subtitle="Annual direct compensation payout"
          icon={CreditCard}
          color="emerald"
        />
      </div>

      {/* Search Toolbar */}
      <Card className="p-4 bg-white">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee by name, dept, or ID..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
      </Card>

      {/* Payroll Records Table */}
      <Card>
        <CardHeader
          title="Employee Compensation Records"
          subtitle={`Managing ${filteredPayrolls.length} personnel profiles`}
        />

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading compensation records...
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No payroll records found matching your query.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Annual Gross Base</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Annual Net Take-Home</TableHead>
                <TableHead>Monthly Net</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrolls.map((p) => {
                const base = Number(p.base_salary || 0);
                const ded = Number(p.deductions || 0);
                const net = base - ded;
                return (
                  <TableRow key={p.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">{p.users?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p.users?.employee_id || 'DF-1000'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{p.users?.department || 'General'}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-900">
                      ${base.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-rose-600">
                      -${ded.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-emerald-700">
                      ${net.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      ${Math.round(net / 12).toLocaleString()}/mo
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Edit2}
                        onClick={() => handleEditClick(p)}
                        className="text-purple-700 hover:bg-purple-50 text-xs px-2.5 py-1"
                      >
                        Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Adjust Compensation Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Adjust Employee Compensation"
        subtitle={`Modifying salary agreement for ${editItem?.name}`}
      >
        {editItem && (
          <form onSubmit={handleSavePayroll} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Annual Gross Base Salary ($ USD) *
              </label>
              <input
                type="number"
                required
                min="1000"
                step="500"
                value={editItem.base_salary}
                onChange={(e) => setEditItem({ ...editItem, base_salary: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Annual Deductions ($ USD) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={editItem.deductions}
                onChange={(e) => setEditItem({ ...editItem, deductions: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            {/* Live calculation preview */}
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 space-y-2 text-xs">
              <div className="flex justify-between text-purple-900">
                <span>Calculated Net Annual Salary:</span>
                <span className="font-bold font-mono">
                  ${(Number(editItem.base_salary || 0) - Number(editItem.deductions || 0)).toLocaleString()} USD
                </span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>Estimated Monthly Net Deposit:</span>
                <span className="font-semibold font-mono">
                  ${Math.round((Number(editItem.base_salary || 0) - Number(editItem.deductions || 0)) / 12).toLocaleString()} USD
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                icon={Save}
                className="bg-purple-600 hover:bg-purple-700 font-bold"
              >
                Save Compensation Update
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
