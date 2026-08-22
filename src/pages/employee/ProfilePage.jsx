// src/pages/employee/ProfilePage.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  DollarSign,
  Shield,
  Save,
  CheckCircle2,
  Camera,
  Info,
  Lock,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage = () => {
  const { currentUser, updateCurrentUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form editable fields (phone, address, profile_pic)
  const [formData, setFormData] = useState({
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    profile_pic: currentUser?.profile_pic || ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setFormData({ ...formData, profile_pic: newAvatar });
    toast.success("Generated new avatar artwork!");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data, error } = await userService.updateUser(currentUser.id, {
        phone: formData.phone,
        address: formData.address,
        profile_pic: formData.profile_pic
      });

      if (error) {
        toast.error(error);
      } else {
        updateCurrentUserProfile(data);
        toast.success("Profile contact details updated successfully!");
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <Avatar
              src={formData.profile_pic || currentUser?.profile_pic}
              name={currentUser?.name}
              size="2xl"
              role={currentUser?.role}
              className="ring-4 ring-teal-500/30"
            />
            {editing && (
              <button
                type="button"
                onClick={handleRandomAvatar}
                className="absolute inset-0 bg-slate-950/70 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-semibold opacity-90 hover:opacity-100 transition-opacity"
              >
                <Sparkles className="w-5 h-5 text-teal-400 mb-1 animate-spin" />
                Change
              </button>
            )}
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">{currentUser?.name}</h1>
              <Badge variant={currentUser?.role}>{currentUser?.role}</Badge>
            </div>
            <p className="text-sm text-teal-300 font-medium">{currentUser?.job_title}</p>
            <p className="text-xs text-slate-400 mt-1">
              {currentUser?.department} • Employee ID: <span className="font-mono text-slate-300">{currentUser?.employee_id}</span>
            </p>
          </div>

          {!editing ? (
            <Button
              variant="outline"
              onClick={() => setEditing(true)}
              className="border-teal-400/40 text-teal-300 hover:bg-teal-500/10 font-semibold"
            >
              Edit Contact Info
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setEditing(false)}
                className="text-slate-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                icon={Save}
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
              >
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Read-Only Corporate Fields */}
        <Card className="space-y-4">
          <CardHeader
            title="Corporate Directory Data"
            subtitle="Managed by HR & Systems Administrators"
            action={<Lock className="w-4 h-4 text-slate-400" />}
          />

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                Full Legal Name
              </span>
              <div className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-medium text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                {currentUser?.name}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                Corporate Email Address
              </span>
              <div className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-medium text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {currentUser?.email}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                  Employee ID
                </span>
                <div className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono font-medium text-slate-800">
                  {currentUser?.employee_id}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                  System Role
                </span>
                <div className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-medium text-slate-800 capitalize">
                  {currentUser?.role}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                  Assigned Department
                </span>
                <div className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-medium text-slate-800 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  {currentUser?.department}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                  Job Position
                </span>
                <div className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-medium text-slate-800 flex items-center gap-2 truncate">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{currentUser?.job_title}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                Base Annual Compensation
              </span>
              <div className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-medium text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                ${currentUser?.salary?.toLocaleString()} USD
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column: Employee-Writable Personal Details */}
        <Card className="space-y-4">
          <CardHeader
            title="Personal Contact Information"
            subtitle={editing ? "Editing enabled — update details below" : "Editable by employee"}
          />

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Primary Phone Number"
              name="phone"
              disabled={!editing}
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1 (555) 000-0000"
              icon={Phone}
              helperText="Used for two-factor verification and urgent HR outreach"
            />

            <Textarea
              label="Residential Mailing Address"
              name="address"
              disabled={!editing}
              rows={3}
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Full physical street address, city, state, postal code"
              helperText="Official tax residency and pay check mailing address"
            />

            {editing && (
              <Input
                label="Custom Avatar URL"
                name="profile_pic"
                value={formData.profile_pic}
                onChange={handleInputChange}
                placeholder="https://..."
                helperText="Paste direct image link or click 'Change' on the avatar above"
              />
            )}

            <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-xs text-teal-800 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-teal-600" />
              <span>
                According to the Dayflow data contract, employees have self-service write permissions for <strong className="font-semibold">phone, address, and profile_pic</strong>.
              </span>
            </div>

            {editing && (
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                icon={Save}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Save Changes
              </Button>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};
