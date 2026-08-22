// src/pages/employee/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userService, changeUserPassword } from '../../services/userService';
import { payrollService, calculateSalaryBreakdown, DEFAULT_SALARY_COMPONENTS, STATUTORY_CONFIG } from '../../services/payrollService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import {
  User,
  Mail,
  Phone,
  Building,
  DollarSign,
  Shield,
  FileText,
  KeyRound,
  Sparkles,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage = () => {
  const [searchParams] = useSearchParams();
  const targetTab = searchParams.get('tab') || 'resume';
  const { currentUser, isAdmin, updateCurrentUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(targetTab);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Resume / Bio / Skills
  const [resumeData, setResumeData] = useState({
    about: currentUser?.resume?.about || 'Dedicated and results-oriented professional with passion for innovation.',
    skills: (currentUser?.resume?.skills || ['Leadership', 'Software Architecture', 'Agile Workflows']).join(', '),
    certifications: (currentUser?.resume?.certifications || ['Certified Enterprise Specialist (2025)']).join(', ')
  });

  // Private Info Form
  const [privateData, setPrivateData] = useState({
    address: currentUser?.private_info?.address || currentUser?.address || '742 Evergreen Terrace, Springfield, OR',
    bank_name: currentUser?.private_info?.bank_name || 'HDFC Corporate Bank',
    bank_account: currentUser?.private_info?.bank_account || '•••• •••• 9812',
    emergency_contact: currentUser?.private_info?.emergency_contact || '+1 (555) 019-2831 (Spouse)',
    dob: currentUser?.private_info?.dob || '1995-06-15',
    nationality: currentUser?.private_info?.nationality || 'Indian',
    phone: currentUser?.phone || '+1 (555) 234-5678',
    profile_pic: currentUser?.profile_pic || ''
  });

  // Security / Password Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Admin-Only Salary Configuration State
  const [salaryProfile, setSalaryProfile] = useState(null);
  const [monthlyWage, setMonthlyWage] = useState(250000);
  const [wageType, setWageType] = useState('Fixed Wage');
  const [workingDays, setWorkingDays] = useState(5);
  const [breakTime, setBreakTime] = useState(60);
  const [components, setComponents] = useState(DEFAULT_SALARY_COMPONENTS);
  const [statutory, setStatutory] = useState(STATUTORY_CONFIG);

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab'));
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAdmin && currentUser) {
      payrollService.getEmployeeSalaryProfile(currentUser.id).then(({ data }) => {
        if (data) {
          setSalaryProfile(data);
          setMonthlyWage(data.monthly_wage || 250000);
          setComponents(data.components || DEFAULT_SALARY_COMPONENTS);
        }
      });
    }
  }, [isAdmin, currentUser]);

  const handleSavePrivate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateUser(currentUser.id, {
        phone: privateData.phone,
        address: privateData.address,
        profile_pic: privateData.profile_pic,
        private_info: {
          address: privateData.address,
          bank_name: privateData.bank_name,
          bank_account: privateData.bank_account,
          emergency_contact: privateData.emergency_contact,
          dob: privateData.dob,
          nationality: privateData.nationality
        },
        resume: {
          about: resumeData.about,
          skills: resumeData.skills.split(',').map(s => s.trim()),
          certifications: resumeData.certifications.split(',').map(s => s.trim())
        }
      });
      updateCurrentUserProfile({ phone: privateData.phone, address: privateData.address, profile_pic: privateData.profile_pic });
      toast.success("Profile records updated successfully!");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      const { success, error } = await changeUserPassword(currentUser.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Password changed successfully!");
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSalaryConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await payrollService.updateSalaryProfile(currentUser.id, {
        monthlyWage,
        wageType,
        workingDays,
        breakTime,
        components,
        statutory
      });
      toast.success("Salary profile and components updated!");
    } finally {
      setSaving(false);
    }
  };

  // Real-time calculation of salary components
  const calculated = calculateSalaryBreakdown(monthlyWage, components, statutory);

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Top Banner with Employee Header Information */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <Avatar
              src={currentUser?.profile_pic}
              name={currentUser?.name}
              size="xl"
              role={currentUser?.role}
            />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {currentUser?.name || 'Employee Profile'}
                </h1>
                <Badge variant={currentUser?.role}>{currentUser?.role}</Badge>
              </div>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {currentUser?.job_title || 'Specialist'} • {currentUser?.department || 'Engineering'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                <span className="font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-800 dark:text-zinc-200">
                  ID: {currentUser?.employee_id || currentUser?.login_id || 'OIUSER20260001'}
                </span>
                <span>•</span>
                <span>Joining: {currentUser?.joining_date || '2026-01-15'}</span>
                <span>•</span>
                <span>Manager: {currentUser?.manager || 'Elena Rostova'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              editing
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
            }`}
          >
            {editing ? 'Discard Edits' : 'Edit Profile'}
          </button>
        </div>
      </Card>

      {/* Tabs Navigation (Odoo Wireframe Style: Resume, Private Info, Salary Info, Security) */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg w-fit border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('resume')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'resume'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Resume / About
        </button>

        <button
          onClick={() => setActiveTab('private')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'private'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Private Info
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('salary')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'salary'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Salary Info (Admin)
          </button>
        )}

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Security
        </button>
      </div>

      {/* TAB 1: RESUME & ABOUT */}
      {activeTab === 'resume' && (
        <Card className="p-6 space-y-6">
          <CardHeader
            title="Professional Resume & Background"
            subtitle="Skills, certifications, and career highlights"
          />

          {editing ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">About Me / Bio</label>
                <textarea
                  rows={3}
                  value={resumeData.about}
                  onChange={(e) => setResumeData({ ...resumeData, about: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={resumeData.skills}
                  onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Certifications (comma separated)</label>
                <input
                  type="text"
                  value={resumeData.certifications}
                  onChange={(e) => setResumeData({ ...resumeData, certifications: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSavePrivate}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Resume Details'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  About & Background
                </span>
                <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed">{resumeData.about}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                    Core Skills & Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeData.skills.split(',').map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                    Certifications & Accreditations
                  </span>
                  <div className="space-y-1 text-zinc-800 dark:text-zinc-200 font-medium">
                    {resumeData.certifications.split(',').map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{c.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: PRIVATE INFO */}
      {activeTab === 'private' && (
        <Card className="p-6">
          <CardHeader
            title="Private & Identification Information"
            subtitle="Personal contact details, banking info, and emergency numbers"
          />

          <form onSubmit={handleSavePrivate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Personal Phone</label>
                <input
                  type="text"
                  disabled={!editing}
                  value={privateData.phone}
                  onChange={(e) => setPrivateData({ ...privateData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white disabled:bg-zinc-50 dark:disabled:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  disabled={!editing}
                  value={privateData.dob}
                  onChange={(e) => setPrivateData({ ...privateData, dob: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white disabled:bg-zinc-50 dark:disabled:bg-zinc-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Residential Address</label>
                <input
                  type="text"
                  disabled={!editing}
                  value={privateData.address}
                  onChange={(e) => setPrivateData({ ...privateData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white disabled:bg-zinc-50 dark:disabled:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Bank Name</label>
                <input
                  type="text"
                  disabled={!editing}
                  value={privateData.bank_name}
                  onChange={(e) => setPrivateData({ ...privateData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white disabled:bg-zinc-50 dark:disabled:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  disabled={!editing}
                  value={privateData.bank_account}
                  onChange={(e) => setPrivateData({ ...privateData, bank_account: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white disabled:bg-zinc-50 dark:disabled:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  disabled={!editing}
                  value={privateData.emergency_contact}
                  onChange={(e) => setPrivateData({ ...privateData, emergency_contact: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white disabled:bg-zinc-50 dark:disabled:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nationality</label>
                <input
                  type="text"
                  disabled={!editing}
                  value={privateData.nationality}
                  onChange={(e) => setPrivateData({ ...privateData, nationality: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white disabled:bg-zinc-50 dark:disabled:bg-zinc-900"
                />
              </div>
            </div>

            {editing && (
              <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Private Information'}
                </button>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* TAB 3: SALARY INFO (STRICTLY ADMIN ONLY) */}
      {activeTab === 'salary' && (
        <>
          {!isAdmin ? (
            <Card className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Salary Information Restricted</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                Per organizational compliance policy, detailed salary structures, component breakdowns, and wage configurations are visible exclusively to System Administrators.
              </p>
            </Card>
          ) : (
            <Card className="p-6 space-y-6">
              <CardHeader
                title="Salary Configuration & Components (Admin View)"
                subtitle="Configurable wage structures, automatic percentage formulas, PF, and Professional Tax"
              />

              <form onSubmit={handleSaveSalaryConfig} className="space-y-6 text-xs">
                {/* Wage & Working Schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Wage Type</label>
                    <select
                      value={wageType}
                      onChange={(e) => setWageType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                    >
                      <option value="Fixed Wage">Fixed Wage</option>
                      <option value="Hourly Wage">Hourly Wage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Monthly Wage (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={monthlyWage}
                      onChange={(e) => setMonthlyWage(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Yearly Wage (Calculated)</label>
                    <input
                      type="text"
                      disabled
                      value={`₹${(monthlyWage * 12).toLocaleString()}`}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Working Days / Week</label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={workingDays}
                      onChange={(e) => setWorkingDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Live Salary Components Formula Matrix */}
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px] mb-3">
                    Configurable Salary Components Matrix
                  </h4>

                  <div className="space-y-2.5">
                    {calculated.components.map((comp) => (
                      <div key={comp.id} className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white text-xs">{comp.name}</p>
                            <p className="text-[10px] text-zinc-500">
                              {comp.type === 'percent_wage' ? `${comp.rate}% of Total Monthly Wage` : comp.type === 'percent_basic' ? `${comp.rate}% of Basic Salary` : `Fixed Allowance`}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white">
                            ₹{comp.calculatedAmount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">per month</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statutory PF & Tax Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                      Provident Fund (PF)
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-700 dark:text-zinc-300">Rate: 12% of Basic Salary</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        -₹{calculated.pfAmount.toLocaleString()} / mo
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                      Professional Tax
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-700 dark:text-zinc-300">Monthly Standard</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        -₹{calculated.profTax.toLocaleString()} / mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net Take-Home Calculated Banner */}
                <div className="p-4 rounded-xl bg-zinc-900 text-white dark:bg-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">Computed Net Payout</span>
                    <p className="text-xl font-bold font-mono text-white mt-0.5">
                      ₹{calculated.netTakeHome.toLocaleString()} <span className="text-xs font-normal text-zinc-400">INR / month</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-white text-zinc-900 font-bold hover:bg-zinc-100 transition cursor-pointer"
                  >
                    {saving ? 'Updating...' : 'Save Salary Configuration'}
                  </button>
                </div>
              </form>
            </Card>
          )}
        </>
      )}

      {/* TAB 4: SECURITY */}
      {activeTab === 'security' && (
        <Card className="p-6">
          <CardHeader
            title="Account Security & Password"
            subtitle="Update your sign-in password and manage account credentials"
          />

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs max-w-md">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold cursor-pointer"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
};
