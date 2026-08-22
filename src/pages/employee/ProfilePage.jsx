// src/pages/employee/ProfilePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userService, changeUserPassword } from '../../services/userService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
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
  Briefcase,
  Download,
  Upload,
  Camera,
  MapPin,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

// Sample curated profile picture presets
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=256&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&auto=format&fit=crop&q=80"
];

// Country code options
const COUNTRY_PHONE_CODES = [
  { code: '+91', country: 'India (Default)', placeholder: '98765 43210' },
  { code: '+1', country: 'United States / Canada', placeholder: '(555) 234-5678' },
  { code: '+44', country: 'United Kingdom', placeholder: '7911 123456' },
  { code: '+971', country: 'United Arab Emirates', placeholder: '50 123 4567' },
  { code: '+65', country: 'Singapore', placeholder: '8123 4567' },
  { code: '+61', country: 'Australia', placeholder: '412 345 678' },
  { code: '+49', country: 'Germany', placeholder: '151 23456789' }
];

export const ProfilePage = () => {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const targetTab = searchParams.get('tab') || 'personal';

  const { currentUser, isAdmin, updateCurrentUserProfile } = useAuth();
  const [profileUser, setProfileUser] = useState(currentUser);
  const [activeTab, setActiveTab] = useState(targetTab);
  const [loading, setLoading] = useState(true);

  // Edit Profile Details Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Photo Upload / Edit Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const fileInputRef = useRef(null);

  // Employee editable personal fields
  const [editCountryCode, setEditCountryCode] = useState('+91');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editProfilePic, setEditProfilePic] = useState('');

  // Admin editable fields
  const [adminEditName, setAdminEditName] = useState('');
  const [adminEditJobTitle, setAdminEditJobTitle] = useState('');
  const [adminEditDepartment, setAdminEditDepartment] = useState('');
  const [adminEditRole, setAdminEditRole] = useState('employee');
  const [adminEditSalary, setAdminEditSalary] = useState(0);

  // Security / Password Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPass, setChangingPass] = useState(false);

  // Documents Store State
  const [documents, setDocuments] = useState([
    { id: 'doc-01', name: 'Offer_Letter_Dayflow.pdf', type: 'Employment Agreement', date: '2026-01-15', size: '240 KB' },
    { id: 'doc-02', name: 'National_ID_Aadhaar_Card.pdf', type: 'Identity Proof', date: '2026-01-16', size: '512 KB' },
    { id: 'doc-03', name: 'PAN_Card_Copy.pdf', type: 'Tax Document', date: '2026-01-16', size: '320 KB' },
    { id: 'doc-04', name: 'Non_Disclosure_Agreement_NDA.pdf', type: 'Legal NDA', date: '2026-01-15', size: '180 KB' },
    { id: 'doc-05', name: 'Form_16_Annual_Tax_Statement.pdf', type: 'Statutory Form 16', date: '2026-04-10', size: '640 KB' }
  ]);

  // Upload Document Modal
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('Identity Proof');

  // Load User Data
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        if (targetUserId && targetUserId !== currentUser?.id) {
          const { data } = await userService.getUser(targetUserId);
          setProfileUser(data || currentUser);
        } else {
          setProfileUser(currentUser);
        }
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [targetUserId, currentUser]);

  // Sync state with profileUser
  useEffect(() => {
    if (profileUser) {
      const rawPhone = profileUser.phone || '';
      const matched = COUNTRY_PHONE_CODES.find(c => rawPhone.startsWith(c.code));
      if (matched) {
        setEditCountryCode(matched.code);
        setEditPhone(rawPhone.replace(matched.code, '').trim());
      } else {
        setEditCountryCode('+91');
        setEditPhone(rawPhone.replace('+91', '').trim() || '98765 43210');
      }

      setEditAddress(profileUser.address || 'Flat 402, Whitefield, Bengaluru');
      setEditProfilePic(profileUser.profile_pic || '');
      setSelectedPhoto(profileUser.profile_pic || '');
      setPhotoUrlInput(profileUser.profile_pic || '');

      setAdminEditName(profileUser.name || '');
      setAdminEditJobTitle(profileUser.job_title || 'Software Engineer');
      setAdminEditDepartment(profileUser.department || 'Engineering');
      setAdminEditRole(profileUser.role || 'employee');
      setAdminEditSalary(profileUser.salary || 1450000);
    }
  }, [profileUser]);

  const isViewingSelf = !targetUserId || targetUserId === currentUser?.id;
  const canAdminEdit = isAdmin;

  // Handle Local Image Upload for Profile Picture
  const handleLocalImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result;
        setSelectedPhoto(base64Url);
        setPhotoUrlInput('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Updated Profile Picture
  const handleSavePhoto = async () => {
    const photoToSave = selectedPhoto || photoUrlInput || profileUser.profile_pic;
    if (!photoToSave) {
      toast.error("Please select or enter an image URL");
      return;
    }

    setSaving(true);
    try {
      const updates = { profile_pic: photoToSave };
      const { data, error } = await userService.updateUser(profileUser.id, updates);
      if (error) {
        toast.error(error);
      } else {
        setProfileUser(prev => ({ ...prev, profile_pic: photoToSave }));
        if (isViewingSelf) {
          updateCurrentUserProfile(updates);
        }
        toast.success("Profile picture updated successfully!");
        setIsPhotoModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  // Save General Profile Details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fullPhone = `${editCountryCode} ${editPhone}`.trim();
      const updates = {
        phone: fullPhone,
        address: editAddress,
        profile_pic: editProfilePic || profileUser.profile_pic
      };

      if (canAdminEdit) {
        updates.name = adminEditName;
        updates.job_title = adminEditJobTitle;
        updates.department = adminEditDepartment;
        updates.role = adminEditRole;
        updates.salary = Number(adminEditSalary) || profileUser.salary;
      }

      const { data, error } = await userService.updateUser(profileUser.id, updates);
      if (error) {
        toast.error(error);
      } else {
        setProfileUser(data || { ...profileUser, ...updates });
        if (isViewingSelf) {
          updateCurrentUserProfile(updates);
        }
        toast.success("Profile records saved successfully!");
        setIsEditModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setChangingPass(true);
    try {
      const { error } = await changeUserPassword(profileUser.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Password updated successfully!");
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } finally {
      setChangingPass(false);
    }
  };

  // Handle Upload Document
  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newDocName) return;
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: newDocName.endsWith('.pdf') ? newDocName : `${newDocName}.pdf`,
      type: newDocType,
      date: new Date().toISOString().split('T')[0],
      size: '380 KB'
    };
    setDocuments([newDoc, ...documents]);
    toast.success(`Document "${newDoc.name}" uploaded to employee file.`);
    setIsUploadDocOpen(false);
    setNewDocName('');
  };

  const handleDownloadDoc = (docName) => {
    toast.success(`Downloading ${docName}...`);
  };

  const payslips = [
    { month: 'August 2026', gross: '₹1,20,833', deductions: '₹25,383', net: '₹95,450', status: 'Paid', date: '2026-08-20' },
    { month: 'July 2026', gross: '₹1,20,833', deductions: '₹25,383', net: '₹95,450', status: 'Paid', date: '2026-07-20' },
    { month: 'June 2026', gross: '₹1,20,833', deductions: '₹25,383', net: '₹95,450', status: 'Paid', date: '2026-06-20' },
    { month: 'May 2026', gross: '₹1,20,833', deductions: '₹25,383', net: '₹95,450', status: 'Paid', date: '2026-05-20' }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP PROFILE HEADER & ACTIONS
      ───────────────────────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Interactive Avatar with Camera Upload Badge */}
            <div className="relative group cursor-pointer" onClick={() => setIsPhotoModalOpen(true)}>
              <Avatar
                src={profileUser?.profile_pic}
                name={profileUser?.name}
                size="xl"
                role={profileUser?.role}
              />
              <div
                className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title="Click to change profile picture"
              >
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[9px] text-white font-bold mt-0.5">Edit Photo</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPhotoModalOpen(true);
                }}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg border-2 border-white dark:border-zinc-900 transition cursor-pointer"
                title="Upload Profile Picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {profileUser?.name}
                </h1>
                <Badge variant={profileUser?.role}>{profileUser?.role}</Badge>
                {!isViewingSelf && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    HR Admin View
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {profileUser?.job_title || 'Software Engineer'} • {profileUser?.department || 'Engineering'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                <span className="font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-800 dark:text-zinc-200">
                  ID: {profileUser?.employee_id || 'DF-1001'}
                </span>
                <span>•</span>
                <span>Joining: {profileUser?.joining_date || '2026-01-15'}</span>
                <span>•</span>
                <span>PAN: {profileUser?.bank_details?.pan || 'ABCDE1234F'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={Camera}
              onClick={() => setIsPhotoModalOpen(true)}
            >
              Upload Photo
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={User}
              onClick={() => setIsEditModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 font-semibold"
            >
              {canAdminEdit && !isViewingSelf ? 'Edit Employee (Admin)' : 'Edit Details'}
            </Button>
          </div>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          2. TAB NAVIGATION (Horizontal Bar)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-fit border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'personal'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Personal & Job Info
        </button>

        <button
          onClick={() => setActiveTab('salary')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'salary'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Salary Structure
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'documents'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Documents & Payslips
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Security
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: PERSONAL & JOB DETAILS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Details Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" /> Personal Details
              </h3>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-[11px] font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
              >
                Edit Info
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800">
                <span className="text-zinc-500">Full Name</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{profileUser?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800">
                <span className="text-zinc-500">Email Address</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{profileUser?.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800">
                <span className="text-zinc-500">Contact Phone</span>
                <span className="font-mono font-semibold text-teal-700 dark:text-teal-300">
                  {profileUser?.phone || '+91 98765 43210'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800">
                <span className="text-zinc-500">Residential Address</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200 text-right max-w-xs">
                  {profileUser?.address || 'Flat 402, Whitefield, Bengaluru'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800">
                <span className="text-zinc-500">Nationality</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Indian</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Emergency Contact</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">+91 98111 22334 (Spouse)</span>
              </div>
            </div>
          </Card>

          {/* Job Details Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-600" /> Job & Employment Details
              </h3>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Admin Controlled
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800">
                <span className="text-zinc-500">Employee ID</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{profileUser?.employee_id || 'DF-1001'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800">
                <span className="text-zinc-500">Job Title / Designation</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{profileUser?.job_title || 'Software Engineer'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800">
                <span className="text-zinc-500">Department</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{profileUser?.department || 'Engineering'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800">
                <span className="text-zinc-500">System Role</span>
                <span className="font-semibold capitalize text-zinc-900 dark:text-white">{profileUser?.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800">
                <span className="text-zinc-500">Date of Joining</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{profileUser?.joining_date || '15 Jan 2026'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Reporting Manager</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Alex Rivera (Head of People)</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: SALARY STRUCTURE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'salary' && (
        <Card className="p-6 space-y-6">
          <CardHeader
            title="Employee Salary Structure & Compensation"
            subtitle="Detailed monthly breakdown of Basic Pay, HRA, Allowances, PF, and Net Payout"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Annual CTC Package</span>
              <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white mt-1">
                ₹{((profileUser?.salary || 1450000)).toLocaleString('en-IN')} <span className="text-xs font-normal text-zinc-500">/ year</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Gross Monthly Wage</span>
              <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white mt-1">
                ₹1,20,833 <span className="text-xs font-normal text-zinc-500">/ month</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase">Net Take-Home Pay</span>
              <p className="text-lg font-bold font-mono text-teal-800 dark:text-teal-200 mt-1">
                ₹95,450 <span className="text-xs font-normal text-teal-600">/ month</span>
              </p>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-800 py-2.5 px-4 font-bold text-zinc-700 dark:text-zinc-300">
              <span>Salary Component</span>
              <span>Calculation Basis</span>
              <span className="text-right">Monthly Amount</span>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              <div className="grid grid-cols-3 py-2.5 px-4">
                <span className="font-semibold text-zinc-900 dark:text-white">Basic Salary</span>
                <span className="text-zinc-500">50% of Monthly Gross</span>
                <span className="font-mono font-bold text-right">₹60,417</span>
              </div>
              <div className="grid grid-cols-3 py-2.5 px-4">
                <span className="font-semibold text-zinc-900 dark:text-white">House Rent Allowance (HRA)</span>
                <span className="text-zinc-500">50% of Basic Pay</span>
                <span className="font-mono font-bold text-right">₹30,208</span>
              </div>
              <div className="grid grid-cols-3 py-2.5 px-4">
                <span className="font-semibold text-zinc-900 dark:text-white">Special & Flexible Allowance</span>
                <span className="text-zinc-500">Balancing Allowance</span>
                <span className="font-mono font-bold text-right">₹30,208</span>
              </div>
              <div className="grid grid-cols-3 py-2.5 px-4 text-rose-600 dark:text-rose-400 bg-rose-50/30">
                <span className="font-semibold">Provident Fund (PF - Employee)</span>
                <span>12% of Basic Pay</span>
                <span className="font-mono font-bold text-right">-₹7,250</span>
              </div>
              <div className="grid grid-cols-3 py-2.5 px-4 text-rose-600 dark:text-rose-400 bg-rose-50/30">
                <span className="font-semibold">TDS / Professional Tax</span>
                <span>Statutory Monthly Deductions</span>
                <span className="font-mono font-bold text-right">-₹18,133</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: DOCUMENTS & PAYSLIPS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader
              title="Official Monthly Payslips"
              subtitle="Download or inspect monthly salary slips generated for tax & banking compliance"
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Gross Amount</TableHead>
                  <TableHead>Total Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((slip) => (
                  <TableRow key={slip.month}>
                    <TableCell className="font-bold text-zinc-900 dark:text-white text-xs">{slip.month}</TableCell>
                    <TableCell className="font-mono text-xs">{slip.gross}</TableCell>
                    <TableCell className="font-mono text-xs text-rose-600">{slip.deductions}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300">{slip.net}</TableCell>
                    <TableCell>
                      <Badge variant="present">Paid</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleDownloadDoc(`Payslip_${slip.month.replace(' ', '_')}.pdf`)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> Download Slip
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Official Documents & Contracts</h3>
                <p className="text-[11px] text-zinc-500">Employment agreement, Aadhaar / PAN identity cards, and NDA</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Upload}
                onClick={() => setIsUploadDocOpen(true)}
              >
                Upload Document
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div key={doc.id} className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight truncate max-w-[200px]">{doc.name}</p>
                      <p className="text-[10px] text-zinc-500">{doc.type} • {doc.size}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadDoc(doc.name)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: SECURITY & PASSWORD
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <Card className="p-6 max-w-md">
          <CardHeader
            title="Account Password & Security"
            subtitle="Change your Dayflow credentials"
          />

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
              />
            </div>

            <Button type="submit" variant="primary" loading={changingPass} className="bg-teal-600 hover:bg-teal-700 font-bold">
              Update Password
            </Button>
          </form>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: UPLOAD / EDIT PROFILE PICTURE
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Update Profile Picture"
        subtitle="Upload a local image file, enter an image URL, or choose a preset avatar"
      >
        <div className="space-y-5 text-xs">
          {/* Current / Selected Preview */}
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <div className="relative">
              <Avatar
                src={selectedPhoto || photoUrlInput || profileUser.profile_pic}
                name={profileUser?.name}
                size="xl"
                role={profileUser?.role}
              />
            </div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-2">
              Photo Preview
            </p>
          </div>

          {/* Option A: Upload Local Image File */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Option 1: Upload from Computer
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleLocalImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-teal-500 dark:hover:border-teal-400 rounded-xl flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer font-medium"
            >
              <Upload className="w-4 h-4 text-teal-600" />
              <span>Choose Image File (JPG, PNG, WebP)</span>
            </button>
          </div>

          {/* Option B: Enter Direct Image URL */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Option 2: Or Paste Image URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={photoUrlInput}
                onChange={(e) => {
                  setPhotoUrlInput(e.target.value);
                  setSelectedPhoto(e.target.value);
                }}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
              />
              <ImageIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Option C: Curated Presets */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Option 3: Or Choose Preset Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedPhoto(preset);
                    setPhotoUrlInput(preset);
                  }}
                  className={`p-1 rounded-full border-2 transition cursor-pointer relative ${
                    selectedPhoto === preset
                      ? 'border-teal-600 scale-105 shadow-md'
                      : 'border-transparent hover:border-zinc-300'
                  }`}
                >
                  <img
                    src={preset}
                    alt={`Avatar ${idx + 1}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {selectedPhoto === preset && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsPhotoModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={saving}
              onClick={handleSavePhoto}
              className="bg-teal-600 hover:bg-teal-700 font-bold"
            >
              Save Profile Picture
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: EDIT EMPLOYEE PERSONAL DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={canAdminEdit && !isViewingSelf ? `Edit ${profileUser.name} (Admin)` : "Edit My Personal Details"}
        subtitle={
          canAdminEdit && !isViewingSelf
            ? "Full administrative access to personal, job, role, and salary parameters"
            : "Employees can edit their residential address, contact phone (Indian standard), and profile photo."
        }
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          {/* Profile Picture in Edit Modal */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Profile Picture URL / Upload
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={editProfilePic}
                onChange={(e) => setEditProfilePic(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Camera}
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsPhotoModalOpen(true);
                }}
              >
                Upload
              </Button>
            </div>
          </div>

          {/* Contact Phone with Country Dropdown */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Contact Phone Number (Indian Standard by Default) *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={editCountryCode}
                onChange={(e) => setEditCountryCode(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-semibold"
              >
                {COUNTRY_PHONE_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                ))}
              </select>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="98765 43210"
                className="col-span-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono focus:border-teal-600"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Formatted preview: <span className="font-mono font-bold text-teal-700">{editCountryCode} {editPhone}</span></p>
          </div>

          {/* Residential Address */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Residential Address *
            </label>
            <textarea
              required
              rows={2}
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="House/Flat No, Street, Landmark, City, State, PIN"
              className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
            />
          </div>

          {/* Admin-Only Editable Fields */}
          {canAdminEdit && (
            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" /> Administrative Overrides (Admin Only)
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Employee Full Name</label>
                <input
                  type="text"
                  value={adminEditName}
                  onChange={(e) => setAdminEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Job Designation</label>
                  <input
                    type="text"
                    value={adminEditJobTitle}
                    onChange={(e) => setAdminEditJobTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Department</label>
                  <select
                    value={adminEditDepartment}
                    onChange={(e) => setAdminEditDepartment(e.target.value)}
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">System Role</label>
                  <select
                    value={adminEditRole}
                    onChange={(e) => setAdminEditRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-semibold"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin / HR</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Annual CTC (₹)</label>
                  <input
                    type="number"
                    step="10000"
                    value={adminEditSalary}
                    onChange={(e) => setAdminEditSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} className="bg-teal-600 hover:bg-teal-700 font-bold">
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: UPLOAD DOCUMENT
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        title="Upload Employee Document"
        subtitle="Add identity proofs, education certificates, or tax documents"
      >
        <form onSubmit={handleAddDocument} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Document Title *</label>
            <input
              type="text"
              required
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="e.g. Passport_Copy / Degree_Certificate"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Document Category</label>
            <select
              value={newDocType}
              onChange={(e) => setNewDocType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
            >
              <option value="Identity Proof">Identity Proof (Aadhaar/Passport/Voter)</option>
              <option value="Tax Document">Tax Document (PAN/Form 16)</option>
              <option value="Employment Agreement">Employment Agreement / Letter</option>
              <option value="Educational Certificate">Educational Certificate</option>
            </select>
          </div>

          <div className="p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-center">
            <Upload className="w-6 h-6 mx-auto text-zinc-400 mb-1" />
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">Click to select PDF or image file (max 10MB)</p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsUploadDocOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-teal-600 hover:bg-teal-700">
              Save Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
