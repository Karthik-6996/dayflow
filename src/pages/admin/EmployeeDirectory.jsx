// src/pages/admin/EmployeeDirectory.jsx
<<<<<<< Updated upstream
import React, { useState, useEffect, useRef } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> Stashed changes
import { useNavigate } from 'react-router-dom';
import { userService, generateEmployeeLoginId, generateInitialPassword } from '../../services/userService';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import { calculateSalaryBreakdown, DEFAULT_SALARY_COMPONENTS, STATUTORY_CONFIG } from '../../services/payrollService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
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
  DollarSign,
<<<<<<< Updated upstream
  Briefcase,
  MapPin,
  Clock,
  ChevronRight,
  CreditCard,
  Camera,
  Upload,
  Edit3
=======
  Edit3,
  ExternalLink
>>>>>>> Stashed changes
} from 'lucide-react';
import { toast } from 'sonner';

export const EmployeeDirectory = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
<<<<<<< Updated upstream
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Admin Quick Edit Employee State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const editPhotoInputRef = useRef(null);

  // New Employee Form State
=======

  // Edit Employee Modal (Admin Editing)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // New Employee Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
>>>>>>> Stashed changes
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'employee',
    job_title: 'Software Engineer',
    department: 'Engineering',
    joining_year: 2026,
    salary: 1450000,
    phone: '+91 98765 43210',
    address: ''
  });

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, attRes, leavesRes] = await Promise.all([
        userService.getAllUsers(),
        attendanceService.getAllAttendance({ dateFilter: '2026-08-22' }),
        leaveService.getAllLeaves()
      ]);
      setEmployees(usersRes.data || []);
      setAttendances(attRes.data || []);
      setLeaves(leavesRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

<<<<<<< Updated upstream
  const getEmployeeDynamicStatus = (emp) => {
    const today = new Date().toISOString().split('T')[0];
    const empId = emp.id;
    const loginId = emp.login_id || emp.employee_id;

    const att = attendances.find(a => (a.user_id === empId || a.users?.employee_id === loginId || a.user_id === loginId) && a.date === today);
=======
  const getEmployeeDynamicStatus = (empId) => {
    const today = '2026-08-22';
    const att = attendances.find(a => (a.user_id === empId || a.users?.employee_id === empId) && a.date === today);
>>>>>>> Stashed changes
    if (att && att.check_in_time) {
      return { status: 'present', label: 'Present', color: 'bg-emerald-500', badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
<<<<<<< Updated upstream

    const onLeave = leaves.find(l => (l.user_id === empId || l.user_id === loginId) && l.status === 'approved' && l.start_date <= today && l.end_date >= today);
=======
    const onLeave = leaves.find(l => (l.user_id === empId) && l.status === 'approved' && l.start_date <= today && l.end_date >= today);
>>>>>>> Stashed changes
    if (onLeave) {
      return { status: 'leave', label: 'On Leave', color: 'bg-blue-500', badgeClass: 'text-blue-700 bg-blue-50 border-blue-200' };
    }
<<<<<<< Updated upstream

    return { status: 'absent', label: 'Absent / Weekly Off', color: 'bg-amber-500', badgeClass: 'text-amber-700 bg-amber-50 border-amber-200' };
  };

  const getEmployeeStats = (emp) => {
    const yearlySalary = emp.salary || 1450000;
    const monthlyWage = Math.round(yearlySalary / 12);
    const salaryBreakdown = calculateSalaryBreakdown(monthlyWage, DEFAULT_SALARY_COMPONENTS, STATUTORY_CONFIG);

    const empLeaves = leaves.filter(l => l.user_id === emp.id || l.user_id === emp.employee_id || l.user_id === emp.login_id);
    const approvedPaid = empLeaves.filter(l => l.status === 'approved' && l.type === 'paid').reduce((acc, l) => acc + (Number(l.days) || 1), 0);
    const approvedSick = empLeaves.filter(l => l.status === 'approved' && l.type === 'sick').reduce((acc, l) => acc + (Number(l.days) || 1), 0);
    const pendingCount = empLeaves.filter(l => l.status === 'pending').length;

    const empAtt = attendances.filter(a => a.user_id === emp.id || a.user_id === emp.employee_id || a.user_id === emp.login_id);
    const presentCount = empAtt.filter(a => a.check_in_time).length;
    const totalWorkingExpected = 22;
    const attendanceRate = Math.min(100, Math.round((presentCount / totalWorkingExpected) * 100)) || 95;

    return {
      monthlyWage,
      yearlySalary,
      salaryBreakdown,
      leavesSummary: {
        paidAvailable: Math.max(0, 24 - approvedPaid),
        sickAvailable: Math.max(0, 7 - approvedSick),
        pendingCount
      },
      attendanceRate
    };
  };

  const handleOpenEditModal = (emp, e) => {
    e.stopPropagation();
    setEditingEmp({ ...emp });
    setIsEditModalOpen(true);
  };

  const handleLocalImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditingEmp(prev => ({ ...prev, profile_pic: event.target?.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAdminEdit = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;
    setSavingEdit(true);
    try {
      const { data, error } = await userService.updateUser(editingEmp.id, {
        name: editingEmp.name,
        email: editingEmp.email,
        job_title: editingEmp.job_title,
        department: editingEmp.department,
        role: editingEmp.role,
        salary: Number(editingEmp.salary) || 1450000,
        phone: editingEmp.phone,
        address: editingEmp.address,
        profile_pic: editingEmp.profile_pic
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success(`Profile & photo updated for ${editingEmp.name}!`);
        setIsEditModalOpen(false);
        setEditingEmp(null);
        await loadAllData();
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const previewLoginId = generateEmployeeLoginId(newEmployee.name || 'John Doe', newEmployee.joining_year, employees.length + 1);
  const previewPassword = generateInitialPassword(newEmployee.name || 'John Doe');
=======
    return { status: 'absent', label: 'Absent', color: 'bg-amber-500', badgeClass: 'text-amber-700 bg-amber-50 border-amber-200' };
  };

  // Open Edit Modal for an Employee
  const handleOpenEdit = (emp, e) => {
    e.stopPropagation();
    setEditingEmployee({ ...emp });
    setIsEditModalOpen(true);
  };
>>>>>>> Stashed changes

  // Save Admin Edits for an Employee
  const handleSaveAdminEdit = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setSavingEdit(true);
    try {
      const { data, error } = await userService.updateUser(editingEmployee.id, {
        name: editingEmployee.name,
        email: editingEmployee.email,
        job_title: editingEmployee.job_title,
        department: editingEmployee.department,
        role: editingEmployee.role,
        salary: Number(editingEmployee.salary),
        phone: editingEmployee.phone,
        address: editingEmployee.address,
        profile_pic: editingEmployee.profile_pic
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success(`Details for ${editingEmployee.name} updated successfully!`);
        setIsEditModalOpen(false);
        setEditingEmployee(null);
        await loadAllData();
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Create Employee
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
<<<<<<< Updated upstream
      const { initialPassword, loginId, error } = await userService.createEmployee({
=======
      const loginId = generateEmployeeLoginId(newEmployee.name, newEmployee.joining_year, employees.length + 1);
      const initialPassword = generateInitialPassword(newEmployee.name);

      const { data, error } = await userService.createEmployee({
>>>>>>> Stashed changes
        ...newEmployee,
        login_id: loginId,
        password: initialPassword
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
          salary: 1450000,
          phone: '+91 98765 43210',
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
    const statusInfo = getEmployeeDynamicStatus(emp);
    const matchesStatus = statusFilter === 'all' || statusInfo.status === statusFilter;
    const q = search.toLowerCase();
    return matchesDept && (
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
<<<<<<< Updated upstream
      (emp.employee_id || emp.login_id || '').toLowerCase().includes(q) ||
      (emp.job_title || '').toLowerCase().includes(q) ||
      (emp.department || '').toLowerCase().includes(q);

    return matchesDept && matchesStatus && matchesSearch;
=======
      (emp.employee_id || '').toLowerCase().includes(q) ||
      (emp.job_title || '').toLowerCase().includes(q)
    );
>>>>>>> Stashed changes
  });

  const departments = ['all', ...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div className="space-y-5 animate-fade-in text-zinc-900 dark:text-zinc-100 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Staff & Employee Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
<<<<<<< Updated upstream
              Admin Management • {employees.length} Staff
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Manage employee profiles, update photos, assign designations, and configure salary structures individually
=======
              Admin Management
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Manage employee profiles, job titles, department assignments, and salary structures individually
>>>>>>> Stashed changes
          </p>
        </div>

        <Button
          variant="primary"
          icon={UserPlus}
          onClick={() => setIsAddModalOpen(true)}
<<<<<<< Updated upstream
          className="bg-purple-700 hover:bg-purple-800 self-start sm:self-auto font-semibold"
=======
          className="bg-purple-700 hover:bg-purple-800 self-start sm:self-auto"
>>>>>>> Stashed changes
        >
          Add New Employee
        </Button>
      </div>

      {/* Generated Credentials Alert */}
      {createdCredentials && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Account Created for {createdCredentials.name}
            </h4>
            <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
              Login ID: <span className="font-mono font-bold bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded">{createdCredentials.loginId}</span> | Temporary Password: <span className="font-mono font-bold bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded">{createdCredentials.initialPassword}</span>
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

<<<<<<< Updated upstream
      {/* Search & Filter Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-80">
=======
      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
>>>>>>> Stashed changes
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
<<<<<<< Updated upstream
              placeholder="Search by name, ID, title, department..."
=======
              placeholder="Search by name, employee ID, or title..."
>>>>>>> Stashed changes
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />
          </div>

<<<<<<< Updated upstream
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl overflow-x-auto">
            <span className="text-[11px] text-zinc-400 font-semibold px-2">Status:</span>
            {[
              { id: 'all', label: 'All Staff' },
              { id: 'present', label: '🟢 Present' },
              { id: 'leave', label: '🔵 On Leave' },
              { id: 'absent', label: '🟡 Absent' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
=======
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-zinc-400 font-medium shrink-0">Department:</span>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setDeptFilter(dept)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition cursor-pointer ${
                  deptFilter === dept
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800'
>>>>>>> Stashed changes
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
          <span className="text-[11px] text-zinc-400 font-semibold shrink-0">Department:</span>
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
      </Card>

<<<<<<< Updated upstream
      {/* Staff Cards List */}
=======
      {/* Employee List Grid */}
>>>>>>> Stashed changes
      {loading ? (
        <div className="py-20 text-center text-zinc-400 text-xs">
          Loading employee records...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="p-12 text-center text-zinc-400 text-xs">
          No employees found matching criteria.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEmployees.map((emp) => {
<<<<<<< Updated upstream
            const statusInfo = getEmployeeDynamicStatus(emp);
            const stats = getEmployeeStats(emp);
            const loginId = emp.login_id || emp.employee_id || generateEmployeeLoginId(emp.name, 2026, 1);
=======
            const statusInfo = getEmployeeDynamicStatus(emp.id);
>>>>>>> Stashed changes

            return (
              <div
                key={emp.id}
<<<<<<< Updated upstream
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-700 shadow-xs hover:shadow-md transition-all p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs group"
              >
                {/* 1. Identity & Photo */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-[260px] lg:w-1/4">
                  <div className="relative shrink-0">
                    <Avatar src={emp.profile_pic} name={emp.name} size="lg" role={emp.role} />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${statusInfo.color}`}
                      title={statusInfo.label}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-purple-600 transition">
                        {emp.name}
                      </h3>
                      <Badge variant={emp.role}>{emp.role}</Badge>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5 text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{emp.job_title || 'Specialist'}</span>
                      <span>•</span>
                      <span className="text-zinc-500">{emp.department || 'Operations'}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-zinc-500">
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-bold">
                        {loginId}
                      </span>
                    </div>
                  </div>
=======
                onClick={() => navigate(`/dashboard/profile?userId=${emp.id}`)}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <Avatar src={emp.profile_pic} name={emp.name} size="lg" role={emp.role} />
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight group-hover:text-purple-600 transition">
                      {emp.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{emp.employee_id || 'DF-1001'}</p>
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-1">{emp.job_title}</p>
                    <p className="text-[11px] text-zinc-500">{emp.department}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    ₹{(emp.salary || 1450000).toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={(e) => handleOpenEdit(emp, e)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
>>>>>>> Stashed changes
                </div>

                {/* 2. Contact */}
                <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400 min-w-[180px] lg:w-1/5 border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-800 lg:pl-4 pt-2 lg:pt-0">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[180px]">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{emp.phone || '+91 98765 43210'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[180px]">{emp.address || 'Bengaluru, India'}</span>
                  </div>
                </div>

                {/* 3. Salary */}
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 min-w-[180px] lg:w-1/5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">Monthly Gross:</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">
                      ₹{stats.monthlyWage.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">Net Take-Home:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{stats.salaryBreakdown.netTakeHome.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 4. Action Buttons */}
                <div className="flex items-center justify-end gap-2 lg:w-auto shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditModal(emp, e)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit / Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/profile?userId=${emp.id}`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-900 dark:text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Full Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

<<<<<<< Updated upstream
      {/* Admin Edit Employee & Photo Modal */}
      {isEditModalOpen && editingEmp && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Employee — ${editingEmp.name}`}
          subtitle="Update profile photo, personal information, job title, department, and salary"
        >
          <form onSubmit={handleSaveAdminEdit} className="space-y-4 text-xs">
            {/* Profile Photo Uploader */}
            <div className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <Avatar src={editingEmp.profile_pic} name={editingEmp.name} size="lg" />
              <div className="flex-1 space-y-1.5">
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 text-xs">
                  Change Profile Photo
                </label>
                <input
                  type="file"
                  ref={editPhotoInputRef}
                  accept="image/*"
                  onChange={handleLocalImageUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editPhotoInputRef.current?.click()}
                    className="px-3 py-1.5 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Image File
                  </button>
                  <input
                    type="url"
                    value={editingEmp.profile_pic || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, profile_pic: e.target.value })}
                    placeholder="Or paste image URL..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
                  />
                </div>
              </div>
            </div>

=======
      {/* Admin Edit Employee Modal */}
      {isEditModalOpen && editingEmployee && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Employee Details — ${editingEmployee.name}`}
          subtitle="Admin full update access to personal, job, salary, and contact records"
        >
          <form onSubmit={handleSaveAdminEdit} className="space-y-4 text-xs">
>>>>>>> Stashed changes
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
<<<<<<< Updated upstream
                  value={editingEmp.name}
                  onChange={(e) => setEditingEmp({ ...editingEmp, name: e.target.value })}
=======
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
>>>>>>> Stashed changes
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Work Email *</label>
                <input
                  type="email"
                  required
<<<<<<< Updated upstream
                  value={editingEmp.email}
                  onChange={(e) => setEditingEmp({ ...editingEmp, email: e.target.value })}
=======
                  value={editingEmployee.email}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
>>>>>>> Stashed changes
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Job Designation *</label>
                <input
                  type="text"
                  required
<<<<<<< Updated upstream
                  value={editingEmp.job_title}
                  onChange={(e) => setEditingEmp({ ...editingEmp, job_title: e.target.value })}
=======
                  value={editingEmployee.job_title}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, job_title: e.target.value })}
>>>>>>> Stashed changes
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Department *</label>
                <select
<<<<<<< Updated upstream
                  value={editingEmp.department}
                  onChange={(e) => setEditingEmp({ ...editingEmp, department: e.target.value })}
=======
                  value={editingEmployee.department}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
>>>>>>> Stashed changes
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design & UX">Design & UX</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">System Role</label>
                <select
<<<<<<< Updated upstream
                  value={editingEmp.role}
                  onChange={(e) => setEditingEmp({ ...editingEmp, role: e.target.value })}
=======
                  value={editingEmployee.role}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
>>>>>>> Stashed changes
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-semibold"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin / HR Manager</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Annual CTC (₹)</label>
                <input
                  type="number"
                  step="10000"
<<<<<<< Updated upstream
                  value={editingEmp.salary}
                  onChange={(e) => setEditingEmp({ ...editingEmp, salary: e.target.value })}
=======
                  value={editingEmployee.salary}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, salary: e.target.value })}
>>>>>>> Stashed changes
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono font-bold"
                />
              </div>
            </div>

            <div>
<<<<<<< Updated upstream
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Contact Phone</label>
              <input
                type="text"
                value={editingEmp.phone || ''}
                onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
=======
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Contact Phone (Indian Standard)</label>
              <input
                type="text"
                value={editingEmployee.phone}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
>>>>>>> Stashed changes
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono"
              />
            </div>

<<<<<<< Updated upstream
=======
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Residential Address</label>
              <textarea
                rows={2}
                value={editingEmployee.address}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, address: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
              />
            </div>

>>>>>>> Stashed changes
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={savingEdit} className="bg-purple-700 hover:bg-purple-800 font-bold">
<<<<<<< Updated upstream
                Save Changes
=======
                Save Employee Changes
>>>>>>> Stashed changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

<<<<<<< Updated upstream
      {/* New Employee Creation Modal */}
=======
      {/* Add New Employee Modal */}
>>>>>>> Stashed changes
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Employee"
<<<<<<< Updated upstream
        subtitle="Add a new member to the organization roster"
=======
        subtitle="Add a new member to the Dayflow organizational roster"
>>>>>>> Stashed changes
      >
        <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Work Email *</label>
              <input
                type="email"
                required
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
<<<<<<< Updated upstream
                placeholder="ramesh.kumar@company.com"
=======
                placeholder="ramesh.kumar@dayflow.internal"
>>>>>>> Stashed changes
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Department</label>
              <select
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
              >
                <option value="Engineering">Engineering</option>
                <option value="Design & UX">Design & UX</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Job Designation</label>
              <input
                type="text"
                value={newEmployee.job_title}
                onChange={(e) => setNewEmployee({ ...newEmployee, job_title: e.target.value })}
<<<<<<< Updated upstream
                placeholder="Software Engineer"
=======
                placeholder="Backend Developer"
>>>>>>> Stashed changes
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Annual CTC (₹)</label>
              <input
                type="number"
                step="10000"
                value={newEmployee.salary}
<<<<<<< Updated upstream
                onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) || 1450000 })}
=======
                onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
>>>>>>> Stashed changes
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating} className="bg-purple-700 hover:bg-purple-800 font-bold">
              Provision Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
