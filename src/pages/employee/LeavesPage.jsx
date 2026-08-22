// src/pages/employee/LeavesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { leaveService } from '../../services/leaveService';
import { calculateBalance, calculateWorkingDays, getExcludedDaysBreakdown } from '../../lib/leaveValidation';
import { LEAVE_TYPE } from '../../lib/constants';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  AlertCircle,
  Info,
  Paperclip,
  UploadCloud,
  File,
  X,
  Eye,
  ExternalLink,
  Ban,
  Sun
} from 'lucide-react';
import { toast } from 'sonner';

export const LeavesPage = () => {
  const { currentUser } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelModalLeave, setCancelModalLeave] = useState(null);
  const [viewDocModal, setViewDocModal] = useState(null);
  const [selectedDetailsLeave, setSelectedDetailsLeave] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    type: LEAVE_TYPE.PAID,
    startDate: '',
    endDate: '',
    isHalfDay: false,
    halfDaySession: 'first_half', // first_half or second_half
    remarks: '',
    documentName: null,
    documentUrl: null
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState('');

  const loadLeaves = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { data, error } = await leaveService.getEmployeeLeaves(currentUser.id);
      if (error) toast.error("Error loading leave requests");
      setLeaves(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [currentUser]);

  // Dynamic Balances
  const balances = useMemo(() => ({
    [LEAVE_TYPE.PAID]: calculateBalance(LEAVE_TYPE.PAID, leaves),
    [LEAVE_TYPE.SICK]: calculateBalance(LEAVE_TYPE.SICK, leaves),
    [LEAVE_TYPE.UNPAID]: calculateBalance(LEAVE_TYPE.UNPAID, leaves)
  }), [leaves]);

  // Live calculation of requested working days
  const workingDaysBreakdown = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return null;
    return getExcludedDaysBreakdown(formData.startDate, formData.endDate, formData.isHalfDay);
  }, [formData.startDate, formData.endDate, formData.isHalfDay]);

  const requestedWorkingDays = workingDaysBreakdown?.workingDays || 0;

  // Live balance check
  const currentAvailableBalance = balances[formData.type]?.available ?? 0;
  const isBalanceInsufficient = formData.type !== LEAVE_TYPE.UNPAID &&
    requestedWorkingDays > currentAvailableBalance &&
    requestedWorkingDays > 0;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormError('');

    if (name === 'isHalfDay') {
      setFormData(prev => {
        const isHalf = checked;
        return {
          ...prev,
          isHalfDay: isHalf,
          endDate: isHalf && prev.startDate ? prev.startDate : prev.endDate
        };
      });
      return;
    }

    if (name === 'startDate') {
      setFormData(prev => ({
        ...prev,
        startDate: value,
        endDate: prev.isHalfDay ? value : (prev.endDate && prev.endDate < value ? value : prev.endDate)
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('File size exceeds 5MB limit.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        documentName: file.name,
        documentUrl: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      documentName: null,
      documentUrl: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.startDate || !formData.endDate) {
      setFormError('Please select both start and end dates.');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    if (requestedWorkingDays === 0) {
      setFormError('Selected date range only contains weekends or official holidays (0 working days).');
      return;
    }

    if (isBalanceInsufficient) {
      setFormError(`Insufficient ${formData.type} leave balance. Available: ${currentAvailableBalance} days, Requested: ${requestedWorkingDays} days.`);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await leaveService.submitLeaveRequest({
        userId: currentUser.id,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isHalfDay: formData.isHalfDay,
        halfDaySession: formData.halfDaySession,
        remarks: formData.remarks,
        documentName: formData.documentName,
        documentUrl: formData.documentUrl
      });

      if (error) {
        setFormError(error);
      } else {
        toast.success("Leave request submitted with Pending status!");
        setIsModalOpen(false);
        setFormData({
          type: LEAVE_TYPE.PAID,
          startDate: '',
          endDate: '',
          isHalfDay: false,
          halfDaySession: 'first_half',
          remarks: '',
          documentName: null,
          documentUrl: null
        });
        setSelectedFile(null);
        await loadLeaves();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalLeave) return;
    setCancellingId(cancelModalLeave.id);
    try {
      const { error } = await leaveService.cancelLeaveRequest(cancelModalLeave.id, currentUser.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Leave request cancelled successfully.");
        setCancelModalLeave(null);
        await loadLeaves();
      }
    } finally {
      setCancellingId(null);
    }
  };

  const filteredLeaves = leaves.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;
    return true;
  });

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;
  const cancelledCount = leaves.filter(l => l.status === 'cancelled').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Time Off & Leave Management</h1>
          <p className="text-xs text-slate-500 mt-1">Apply for paid time off, sick leave, track balances, and manage applications</p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setFormError('');
            setIsModalOpen(true);
          }}
          className="self-start shadow-md shadow-teal-600/20"
        >
          Apply for Leave
        </Button>
      </div>

      {/* Leave Balances Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Paid Time Off (PTO)"
          value={`${balances.paid.available} Days Available`}
          subtitle={`${balances.paid.used} used · ${balances.paid.pending} pending · ${balances.paid.total} quota`}
          icon={CalendarDays}
          color="teal"
        />
        <StatCard
          title="Medical / Sick Leave"
          value={`${balances.sick.available} Days Available`}
          subtitle={`${balances.sick.used} used · ${balances.sick.pending} pending · ${balances.sick.total} quota`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Unpaid Sabbatical"
          value={`${balances.unpaid.used} Days Taken`}
          subtitle={`${balances.unpaid.pending} days pending HR review`}
          icon={Sun}
          color="purple"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingCount.toString()}
          subtitle={`${approvedCount} approved · ${rejectedCount} rejected · ${cancelledCount} cancelled`}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Leave Requests Table */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Leave Request History</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive audit trail of your submitted applications</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              <option value="all">All Leave Types</option>
              <option value="paid">Paid Leave (PTO)</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
              {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all whitespace-nowrap ${
                    statusFilter === status
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading leave requests...
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No {statusFilter !== 'all' ? statusFilter : ''} {typeFilter !== 'all' ? typeFilter : ''} leave applications found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Dates & Duration</TableHead>
                <TableHead>Reason / Remarks</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>HR / Manager Remarks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map((leave) => {
                const isPending = leave.status === 'pending';
                const days = leave.days_count !== undefined
                  ? leave.days_count
                  : calculateWorkingDays(leave.start_date, leave.end_date, leave.is_half_day);

                return (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={leave.type}>{leave.type} Leave</Badge>
                        {leave.is_half_day && (
                          <span className="block text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 w-fit">
                            Half Day ({leave.half_day_session === 'first_half' ? 'Morning' : 'Afternoon'})
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-slate-900 text-xs">
                        {leave.start_date === leave.end_date ? (
                          leave.start_date
                        ) : (
                          <span>{leave.start_date} <span className="text-slate-400 font-normal">to</span> {leave.end_date}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-teal-700 font-medium bg-teal-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        {days} {days === 1 ? 'Working Day' : 'Working Days'}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 max-w-xs">
                      {leave.remarks ? (
                        <p className="truncate" title={leave.remarks}>{leave.remarks}</p>
                      ) : (
                        <span className="italic text-slate-400">None provided</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {leave.document_name ? (
                        <button
                          type="button"
                          onClick={() => setViewDocModal({ name: leave.document_name, url: leave.document_url })}
                          className="inline-flex items-center gap-1 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-lg border border-teal-200/70 transition-all cursor-pointer font-medium max-w-[140px] truncate"
                          title={leave.document_name}
                        >
                          <Paperclip className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{leave.document_name}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant={leave.status}>{leave.status}</Badge>
                    </TableCell>

                    <TableCell className="text-xs">
                      {leave.comments ? (
                        <span className="text-slate-700 font-medium bg-slate-100 px-2.5 py-1 rounded-lg block max-w-xs truncate" title={leave.comments}>
                          {leave.comments}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No notes yet</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDetailsLeave(leave)}
                          className="text-slate-600 hover:text-slate-900 text-xs px-2 py-1"
                          title="View complete details"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Details
                        </Button>
                        {isPending ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelModalLeave(leave)}
                            disabled={cancellingId === leave.id}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs px-2 py-1"
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Leave"
        subtitle="Submit a time-off application with dates, category, and remarks"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          {/* Leave Category Selector & Balance Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Leave Category *
              </label>
              <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                Available: {formData.type === LEAVE_TYPE.UNPAID ? 'Unlimited' : `${currentAvailableBalance} Days`}
              </span>
            </div>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all font-medium text-slate-800"
            >
              <option value={LEAVE_TYPE.PAID}>Paid Time Off (PTO / Vacation)</option>
              <option value={LEAVE_TYPE.SICK}>Medical & Sick Leave</option>
              <option value={LEAVE_TYPE.UNPAID}>Unpaid Leave / Extended Sabbatical</option>
            </select>
          </div>

          {/* Half Day Checkbox & Session */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isHalfDay"
                checked={formData.isHalfDay}
                onChange={handleInputChange}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800">
                Apply as Half-Day Leave (0.5 Working Day)
              </span>
            </label>

            {formData.isHalfDay && (
              <div className="pl-6 pt-1 flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="halfDaySession"
                    value="first_half"
                    checked={formData.halfDaySession === 'first_half'}
                    onChange={handleInputChange}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>First Half (Morning)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="halfDaySession"
                    value="second_half"
                    checked={formData.halfDaySession === 'second_half'}
                    onChange={handleInputChange}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>Second Half (Afternoon)</span>
                </label>
              </div>
            )}
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                required
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                End Date *
              </label>
              <input
                type="date"
                required
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                disabled={formData.isHalfDay}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all font-medium text-slate-800 ${
                  formData.isHalfDay ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* Working Days Calculation Preview */}
          {workingDaysBreakdown && formData.startDate && formData.endDate && (
            <div className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
              isBalanceInsufficient
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : requestedWorkingDays === 0
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-teal-50 border-teal-100 text-teal-900'
            }`}>
              <div className="flex items-center justify-between font-semibold">
                <span>Calculated Working Days:</span>
                <span className="text-sm font-bold">
                  {requestedWorkingDays} {requestedWorkingDays === 1 ? 'Day' : 'Days'}
                </span>
              </div>

              {/* Breakdown of excluded days */}
              {(workingDaysBreakdown.weekends.length > 0 || workingDaysBreakdown.holidays.length > 0) && (
                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <span className="font-semibold text-slate-700">Excluded: </span>
                  {workingDaysBreakdown.weekends.length > 0 && (
                    <span>{workingDaysBreakdown.weekends.length} Weekend day(s) </span>
                  )}
                  {workingDaysBreakdown.holidays.length > 0 && (
                    <span>
                      {workingDaysBreakdown.weekends.length > 0 ? '& ' : ''}
                      {workingDaysBreakdown.holidays.map(h => `${h.name} (${h.date})`).join(', ')} (Public Holiday)
                    </span>
                  )}
                </div>
              )}

              {isBalanceInsufficient && (
                <div className="text-rose-700 font-semibold flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Request exceeds your current available balance of {currentAvailableBalance} days.</span>
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason / Remarks
            </label>
            <textarea
              name="remarks"
              rows={2}
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="e.g. Attending doctor appointment, personal travel..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all font-normal text-slate-800"
            />
          </div>

          {/* Upload Supporting Document */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Supporting Document (Optional)
            </label>
            {formData.documentName ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-teal-200 bg-teal-50/50">
                <div className="flex items-center gap-2 min-w-0">
                  <File className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {formData.documentName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className="p-1 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl cursor-pointer bg-slate-50 hover:bg-teal-50/30 transition-all">
                <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700">Click to upload document</span>
                <span className="text-[10px] text-slate-400">PDF, PNG, JPG, or DOC up to 5MB (e.g. Medical notes, tickets)</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100 text-[11px] text-teal-800 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-teal-600" />
            <span>
              Weekends and company gazetted holidays are automatically excluded. Requests are submitted with <strong>Pending</strong> status for HR / Manager review.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={isBalanceInsufficient || requestedWorkingDays === 0}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Submit Leave Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Leave Details Modal */}
      <Modal
        isOpen={!!selectedDetailsLeave}
        onClose={() => setSelectedDetailsLeave(null)}
        title="Leave Request Details"
        subtitle={`Request ID: ${selectedDetailsLeave?.id}`}
      >
        {selectedDetailsLeave && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Leave Type:</span>
                <Badge variant={selectedDetailsLeave.type}>{selectedDetailsLeave.type} Leave</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-slate-800">
                  {selectedDetailsLeave.start_date} to {selectedDetailsLeave.end_date}
                  {selectedDetailsLeave.is_half_day ? ' (Half Day)' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Working Days:</span>
                <span className="font-bold text-teal-700">{selectedDetailsLeave.days_count} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge variant={selectedDetailsLeave.status}>{selectedDetailsLeave.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Applied Reason:</span>
                <span className="text-slate-700 italic">"{selectedDetailsLeave.remarks || 'None provided'}"</span>
              </div>
              {selectedDetailsLeave.comments && (
                <div className="flex justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">HR Feedback / Remarks:</span>
                  <span className="font-semibold text-slate-800">{selectedDetailsLeave.comments}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setSelectedDetailsLeave(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Request Confirmation Modal */}
      <Modal
        isOpen={!!cancelModalLeave}
        onClose={() => setCancelModalLeave(null)}
        title="Cancel Leave Request"
        subtitle="Are you sure you want to cancel this pending leave request?"
      >
        {cancelModalLeave && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Leave Type:</span>
                <Badge variant={cancelModalLeave.type}>{cancelModalLeave.type} Leave</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dates:</span>
                <span className="font-semibold text-slate-800">{cancelModalLeave.start_date} to {cancelModalLeave.end_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-slate-800">{cancelModalLeave.days_count} working days</span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Cancelling will immediately restore your pending days back to your available balance.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setCancelModalLeave(null)}>
                Keep Request
              </Button>
              <Button
                variant="danger"
                loading={cancellingId === cancelModalLeave.id}
                onClick={handleConfirmCancel}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Document Viewer Modal */}
      <Modal
        isOpen={!!viewDocModal}
        onClose={() => setViewDocModal(null)}
        title="Supporting Document Attachment"
        subtitle={viewDocModal?.name}
      >
        {viewDocModal && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <FileText className="w-12 h-12 text-teal-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">{viewDocModal.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">Attached supporting documentation for leave</p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setViewDocModal(null)}>
                Close
              </Button>
              {viewDocModal.url && (
                <a
                  href={viewDocModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={viewDocModal.name}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open / Download File
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};


