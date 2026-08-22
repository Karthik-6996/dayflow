// src/pages/admin/EmployeeDirectory.jsx
import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatCard } from '../../components/ui/StatCard';
import {
  Users,
  Search,
  Building,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  IndianRupee,
  Eye,
  Shield,
  Filter
} from 'lucide-react';
import { formatINR } from '../../lib/currency';
import { toast } from 'sonner';

export const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const { data, error } = await userService.getAllUsers();
        if (error) toast.error("Error loading directory");
        setEmployees(data || []);
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      emp.job_title.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const departments = ['all', ...new Set(employees.map(e => e.department))];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Admin & HR Ops
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Search, inspect, and manage staff records across all corporate departments</p>
        </div>
      </div>

      {/* Directory Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Headcount"
          value={employees.length.toString()}
          subtitle="Active team members"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Departments"
          value={(departments.length - 1).toString()}
          subtitle="Functional divisions"
          icon={Building}
          color="teal"
        />
        <StatCard
          title="Admin Operators"
          value={employees.filter(e => e.role === 'admin').length.toString()}
          subtitle="System & HR administrators"
          icon={Shield}
          color="blue"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, ID, or title..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 font-medium shrink-0">Dept:</span>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setDeptFilter(dept)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-all ${
                  deptFilter === dept
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Employee List Table */}
      <Card>
        <CardHeader
          title="All Registered Personnel"
          subtitle={`Showing ${filteredEmployees.length} of ${employees.length} employees`}
        />

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading employee directory...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No employees match your search criteria.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead>Annual CTC</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={emp.profile_pic} name={emp.name} size="sm" role={emp.role} />
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">{emp.name}</p>
                        <p className="text-[11px] text-slate-500">{emp.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">{emp.employee_id}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {emp.department}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">{emp.job_title}</TableCell>
                  <TableCell>
                    <Badge variant={emp.role}>{emp.role}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-900">
                    {formatINR(emp.salary || 1200000)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => setSelectedUser(emp)}
                      className="text-purple-700 hover:bg-purple-50"
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Employee Detail Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Personnel Record"
        subtitle={`Employee ID: ${selectedUser?.employee_id}`}
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <Avatar src={selectedUser.profile_pic} name={selectedUser.name} size="xl" role={selectedUser.role} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedUser.name}</h3>
                  <Badge variant={selectedUser.role}>{selectedUser.role}</Badge>
                </div>
                <p className="text-xs text-purple-700 font-medium">{selectedUser.job_title}</p>
                <p className="text-xs text-slate-500">{selectedUser.department} Division</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 uppercase text-[10px] block font-semibold">Email</span>
                <span className="font-medium text-slate-800 break-all">{selectedUser.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 uppercase text-[10px] block font-semibold">Phone</span>
                <span className="font-medium text-slate-800">{selectedUser.phone || 'Not provided'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl col-span-2">
                <span className="text-slate-400 uppercase text-[10px] block font-semibold">Address</span>
                <span className="font-medium text-slate-800">{selectedUser.address || 'No residential address on file'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 uppercase text-[10px] block font-semibold">Annual Gross CTC</span>
                <span className="font-bold text-slate-900">{formatINR(selectedUser.salary || 1200000)} / yr</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 uppercase text-[10px] block font-semibold">DB Record UUID</span>
                <span className="font-mono text-[10px] text-slate-500">{selectedUser.id}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
