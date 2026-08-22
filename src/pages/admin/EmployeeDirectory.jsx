// src/pages/admin/EmployeeDirectory.jsx
import React, { useState, useEffect } from 'react';
import { userService, generateEmployeeLoginId, generateInitialPassword } from '../../services/userService';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { StatCard } from '../../components/ui/StatCard';
import {
  Users,
  Search,
  Building,
  Mail,
  Phone,
  Eye,
  Shield,
  Filter,
  UserPlus,
  Lock,
  Copy,
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

import { mockUsers } from '../../mocks/users';

export const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState(mockUsers || []);
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // New Employee Form State
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'employee',
    job_title: 'Software Engineer',
    department: 'Engineering',
    joining_year: 2026,
    salary: 250000,
    phone: '',
    address: ''
  });

  const loadAllData = async () => {
    try {
      const [usersRes, attRes, leavesRes] = await Promise.all([
        userService.getAllUsers(),
        attendanceService.getAllAttendance({ dateFilter: new Date().toISOString().split('T')[0] }),
        leaveService.getAllLeaves()
      ]);
      if (usersRes.data && usersRes.data.length > 0) {
        setEmployees(usersRes.data);
      }
      setAttendances(attRes.data || []);
      setLeaves(leavesRes.data || []);
    } catch (e) {
      console.warn("Background directory refresh:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Compute dynamic status per Odoo specification:
  // 🟢 Green = Present (checked in today)
  // 🔵 Blue = On approved leave today
  // 🟡 Yellow = Absent on expected work day without leave
  const getEmployeeDynamicStatus = (emp) => {
    const today = new Date().toISOString().split('T')[0];
    const empId = emp.id;
    const empCode = emp.employee_id || emp.login_id;
    const empEmail = emp.email;

    // 1. Check attendance check-in for today (or active punch seed)
    const att = attendances.find(a => 
      (a.user_id === empId || a.users?.employee_id === empCode || a.users?.email === empEmail) && 
      (a.date === today || a.date === '2026-08-22')
    );
    if (att && att.check_in_time) {
      return { status: 'present', label: 'Present in Office', color: 'bg-emerald-500', badgeClass: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
    }

    // 2. Check approved leave covering today
    const onLeave = leaves.find(l => 
      (l.user_id === empId || l.users?.employee_id === empCode || l.users?.email === empEmail) && 
      l.status === 'approved' && 
      l.start_date <= today && l.end_date >= today
    );
    if (onLeave) {
      return { status: 'on leave', label: 'On Approved Leave', color: 'bg-blue-500', badgeClass: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' };
    }

    // 3. Otherwise absent on current working day
    return { status: 'absent', label: 'Absent', color: 'bg-amber-500', badgeClass: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
  };

  // Real-time preview of auto-generated Login ID
  const previewLoginId = generateEmployeeLoginId(newEmployee.name || 'John Doe', newEmployee.joining_year, employees.length + 1);
  const previewPassword = generateInitialPassword(newEmployee.name || 'John Doe');

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data, initialPassword, loginId, error } = await userService.createEmployee({
        ...newEmployee,
        login_id: previewLoginId,
        password: previewPassword
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success(`Employee ${newEmployee.name} provisioned!`);
        setCreatedCredentials({ name: newEmployee.name, loginId, initialPassword });
        setIsAddModalOpen(false);
        setNewEmployee({
          name: '',
          email: '',
          role: 'employee',
          job_title: 'Software Engineer',
          department: 'Engineering',
          joining_year: 2026,
          salary: 250000,
          phone: '',
          address: ''
        });
        await loadAllData();
      }
    } finally {
      setCreating(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
      (emp.employee_id || emp.login_id || '').toLowerCase().includes(q) ||
      (emp.job_title || '').toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  const departments = ['all', ...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Employees</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              Odoo Directory
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Click on any employee card to open their profile in view-only or edit mode
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold transition cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <UserPlus className="w-4 h-4" /> New Employee
        </button>
      </div>

      {/* Generated Credentials Success Alert Dialog */}
      {createdCredentials && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Account Created for {createdCredentials.name}
            </h4>
            <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
              Auto Login ID: <span className="font-mono font-bold bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded">{createdCredentials.loginId}</span> | Temporary Password: <span className="font-mono font-bold bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded">{createdCredentials.initialPassword}</span>
            </p>
          </div>
          <button
            onClick={() => setCreatedCredentials(null)}
            className="px-3 py-1 bg-emerald-700 text-white rounded-md font-semibold text-xs self-start cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, Login ID (OIJODO...), title..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-zinc-400 font-medium shrink-0">Dept:</span>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setDeptFilter(dept)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize whitespace-nowrap transition cursor-pointer ${
                  deptFilter === dept
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/60'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Status Indicators Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs px-1 text-zinc-600 dark:text-zinc-400">
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Status Semantics:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present (Checked In)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> On Approved Leave
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Absent
        </span>
      </div>

      {/* Employee Cards Grid (Odoo Wireframe Style) */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400 text-xs">
          Loading employees...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="p-12 text-center text-zinc-400 text-xs">
          No employees found matching your query.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => {
            const statusInfo = getEmployeeDynamicStatus(emp);
            const loginId = emp.login_id || emp.employee_id || generateEmployeeLoginId(emp.name, 2026, 1);

            return (
              <div
                key={emp.id}
                onClick={() => setSelectedUser(emp)}
                className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative group"
              >
                {/* Top Status Indicator Dot */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.color}`} title={statusInfo.label} />
                </div>

                <div>
                  <div className="flex items-center gap-3.5 mb-3">
                    <Avatar src={emp.profile_pic} name={emp.name} size="md" role={emp.role} />
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {emp.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{loginId}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">{emp.job_title || 'Specialist'}</p>
                    <p className="text-[11px] text-zinc-500">{emp.department || 'Operations'}</p>
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] flex items-center justify-between">
                      <span className="truncate max-w-[140px]">{emp.email}</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${statusInfo.badgeClass}`}>
                        {statusInfo.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Employee Creation Modal (With Auto OIJODO Login ID Formula) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Employee"
        subtitle="Automatic Login ID formula: OI + 2 chars First Name + 2 chars Last Name + Year + Serial"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Real-time Dynamic Login ID & Password Formula Generator Preview */}
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Auto-Generated Credentials Preview:
            </span>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Login ID:</span>
              <span className="font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                {previewLoginId}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Initial Password:</span>
              <span className="font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                {previewPassword}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Work Email *
              </label>
              <input
                type="email"
                required
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                placeholder="john.doe@company.com"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Joining Year
              </label>
              <input
                type="number"
                value={newEmployee.joining_year}
                onChange={(e) => setNewEmployee({ ...newEmployee, joining_year: Number(e.target.value) || 2026 })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Department
              </label>
              <select
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Design & UX">Design & UX</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Job Designation
              </label>
              <input
                type="text"
                value={newEmployee.job_title}
                onChange={(e) => setNewEmployee({ ...newEmployee, job_title: e.target.value })}
                placeholder="Software Engineer"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold cursor-pointer"
            >
              {creating ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Employee View-Only / Info Inspection Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name}
        subtitle={`Login ID: ${selectedUser?.login_id || selectedUser?.employee_id} • View-Only Mode`}
      >
        {selectedUser && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <Avatar src={selectedUser.profile_pic} name={selectedUser.name} size="lg" role={selectedUser.role} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">{selectedUser.name}</h3>
                  <Badge variant={selectedUser.role}>{selectedUser.role}</Badge>
                </div>
                <p className="text-xs text-zinc-500">{selectedUser.job_title} • {selectedUser.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 uppercase text-[10px] block font-semibold">Email</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200 break-all">{selectedUser.email}</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 uppercase text-[10px] block font-semibold">Phone</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedUser.phone || 'Not provided'}</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-100 dark:border-zinc-800 col-span-2">
                <span className="text-zinc-400 uppercase text-[10px] block font-semibold">Address</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedUser.address || 'No residential address on file'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
