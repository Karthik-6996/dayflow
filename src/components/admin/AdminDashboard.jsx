/**
 * Dayflow — Admin Dashboard
 * Tab-based layout: Employees | Attendance | Leave Approvals
 * With employee drill-down and real data from Supabase hooks.
 */

import { useState, useEffect, useCallback } from 'react';
import EmployeeList from './EmployeeList.jsx';
import EmployeeDetail from './EmployeeDetail.jsx';
import AttendanceTable from './AttendanceTable.jsx';
import LeaveApprovalQueue from './LeaveApprovalQueue.jsx';
import { getAllEmployees } from '../../services/userService.js';
import { getAllAttendance, getAttendanceSummary } from '../../services/attendanceService.js';
import { getAllLeaves, transitionLeave } from '../../services/leaveService.js';
import { LEAVE_STATUS } from '../../lib/constants.js';

const TABS = [
  { key: 'employees',  label: '👥 Employees',       icon: '👥' },
  { key: 'attendance', label: '📅 Attendance',       icon: '📅' },
  { key: 'leaves',     label: '📋 Leave Approvals',  icon: '📋' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('leaves');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Data states
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState({
    employees: true,
    attendance: true,
    leaves: true,
  });

  // Fetch data
  const fetchEmployees = useCallback(async () => {
    setLoading(p => ({ ...p, employees: true }));
    const { data } = await getAllEmployees();
    setEmployees(data || []);
    setLoading(p => ({ ...p, employees: false }));
  }, []);

  const fetchAttendance = useCallback(async () => {
    setLoading(p => ({ ...p, attendance: true }));
    const { data } = await getAllAttendance();
    setAttendance(data || []);
    setLoading(p => ({ ...p, attendance: false }));
  }, []);

  const fetchLeaves = useCallback(async () => {
    setLoading(p => ({ ...p, leaves: true }));
    const { data } = await getAllLeaves();
    setLeaves(data || []);
    setLoading(p => ({ ...p, leaves: false }));
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    fetchLeaves();
  }, [fetchEmployees, fetchAttendance, fetchLeaves]);

  // Handle leave transition (approve/reject)
  async function handleLeaveTransition(leaveId, action, comments) {
    const result = await transitionLeave({ leaveId, action, comments });
    if (!result.error) {
      await fetchLeaves(); // Refresh the list
    }
    return result;
  }

  // Handle employee selection for drill-down
  async function handleSelectEmployee(emp) {
    setSelectedEmployee(emp);
    // Fetch attendance summary for this employee
    const { data } = await getAttendanceSummary(emp.id);
    setAttendanceSummary(data);
  }

  function handleBackFromDetail() {
    setSelectedEmployee(null);
    setAttendanceSummary(null);
  }

  // Pending count for badge
  const pendingCount = leaves.filter(l => l.status === LEAVE_STATUS.PENDING).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Manage employees, attendance, and leave approvals</p>
        </div>
        <button className="btn btn-ghost" onClick={() => { fetchEmployees(); fetchAttendance(); fetchLeaves(); }}>
          ↻ Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setActiveTab('employees')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Total Employees</div>
          <div className="stat-value">{employees.length}</div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('leaves')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Pending Approvals</div>
          <div className="stat-value" style={{ color: 'var(--color-pending-text)' }}>
            {pendingCount}
          </div>
          <div className="stat-sub">Requires action</div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('attendance')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Attendance Records</div>
          <div className="stat-value">{attendance.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Leave Requests</div>
          <div className="stat-value">{leaves.length}</div>
          <div className="stat-sub">
            {leaves.filter(l => l.status === 'approved').length} approved
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.key); setSelectedEmployee(null); }}
          >
            {tab.label}
            {tab.key === 'leaves' && pendingCount > 0 && (
              <span style={{
                marginLeft: 8,
                background: 'var(--color-danger)',
                color: 'white',
                borderRadius: 'var(--radius-full)',
                padding: '2px 8px',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in">
        {activeTab === 'employees' && (
          selectedEmployee ? (
            <EmployeeDetail
              employee={selectedEmployee}
              leaves={leaves}
              attendanceSummary={attendanceSummary}
              onBack={handleBackFromDetail}
            />
          ) : (
            <EmployeeList
              employees={employees}
              onSelect={handleSelectEmployee}
              loading={loading.employees}
            />
          )
        )}

        {activeTab === 'attendance' && (
          <AttendanceTable
            records={attendance}
            loading={loading.attendance}
          />
        )}

        {activeTab === 'leaves' && (
          <LeaveApprovalQueue
            leaves={leaves}
            onTransition={handleLeaveTransition}
            loading={loading.leaves}
          />
        )}
      </div>
    </div>
  );
}
