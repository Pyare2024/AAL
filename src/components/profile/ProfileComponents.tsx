import React, { useState, useEffect } from 'react';
import { User, Camera, Mail, MapPin, Edit2, Save, X, Phone, Calendar, Users, Briefcase, GraduationCap, Link, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { ProfileData, PersonalInformation } from '../../types/profileTypes';

/**
 * Helper to generate initials from full name
 */
const getInitials = (name: string) => {
  if (!name) return 'IN';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Section 1: Profile Hero Component
 */
export function ProfileHeader({ 
  profile, 
  isEditing, 
  onToggleEdit 
}: { 
  profile: ProfileData; 
  isEditing: boolean; 
  onToggleEdit: () => void; 
}) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.profilePhotoUrl || null);
  const initials = getInitials(profile.personal.fullName);
  const location = profile.personal.city || '';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        alert('Invalid file format. Please upload JPG, PNG, or WebP.');
        return;
      }
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  return (
    <div className="bg-white border border-[#EDEDED] rounded-[24px] p-6 sm:p-10 shadow-sm relative overflow-hidden">
      {/* Background Accent (Subtle, keeping white theme) */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none" />
      
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        
        {/* Left & Center: Identity */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left w-full md:w-auto">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[32px] bg-gradient-to-br from-[#FAFAFA] to-gray-100 border border-[#EDEDED] flex items-center justify-center overflow-hidden shadow-sm">
              {photoPreview ? (
                <img src={photoPreview} alt={profile.personal.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-[#737373]">{initials}</span>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 bg-white border border-[#EDEDED] p-2.5 rounded-2xl shadow-sm cursor-pointer hover:bg-gray-50 transition-colors z-10">
              <Camera className="h-5 w-5 text-[#171717]" />
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          {/* Identity Details */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
                {profile.personal.fullName || 'Not configured'}
              </h1>
              <span className="inline-flex items-center self-center md:self-auto px-3 py-1 text-[11px] font-bold bg-blue-50 border border-blue-200 text-blue-700 rounded-full uppercase tracking-wider">
                INTERN
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-[#737373] pt-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#171717]" />
                <span>{location || 'Location not added'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-[#171717]" />
                <span>{profile.personal.email || 'Email not added'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-[#171717]" />
                <span>{profile.personal.mobile || 'Mobile not added'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions and Status */}
        <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-5">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 text-xs font-bold border rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
              profile.internship.status === 'active' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {profile.internship.status}
            </span>
            <button
              onClick={onToggleEdit}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                isEditing 
                  ? 'bg-gray-100 text-[#171717] hover:bg-gray-200 border border-gray-300' 
                  : 'bg-[#171717] text-white hover:bg-black'
              }`}
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* Completion Indicator */}
          <div className="w-full sm:w-64 space-y-1.5 pt-2 md:pt-6">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-[#737373] uppercase tracking-wider">Profile Completion</span>
              <span className="text-[#171717]">{profile.completionPercentage}%</span>
            </div>
            <div className="w-full bg-[#EDEDED] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#171717] h-full rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${profile.completionPercentage}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section 2: Social & Professional Links
 */
export function ProfileSocialLinks({ personal }: { personal: PersonalInformation }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-6">
      {/* LinkedIn */}
      <a 
        href={personal.linkedInUrl || '#'}
        target={personal.linkedInUrl ? "_blank" : "_self"}
        rel="noopener noreferrer"
        className={`flex-1 bg-white border border-[#EDEDED] p-4 rounded-2xl flex items-center gap-4 transition-all ${
          personal.linkedInUrl ? 'hover:shadow-md hover:border-blue-200' : 'opacity-70 cursor-not-allowed'
        }`}
      >
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <Link className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#171717]">LinkedIn</h3>
          <p className="text-xs text-[#737373] truncate w-48 sm:w-auto">
            {personal.linkedInUrl || 'Not added'}
          </p>
        </div>
      </a>

      {/* GitHub */}
      <a 
        href={personal.githubUrl || '#'}
        target={personal.githubUrl ? "_blank" : "_self"}
        rel="noopener noreferrer"
        className={`flex-1 bg-white border border-[#EDEDED] p-4 rounded-2xl flex items-center gap-4 transition-all ${
          personal.githubUrl ? 'hover:shadow-md hover:border-gray-300' : 'opacity-70 cursor-not-allowed'
        }`}
      >
        <div className="w-12 h-12 bg-gray-100 text-[#171717] rounded-xl flex items-center justify-center shrink-0">
          <Link className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#171717]">GitHub</h3>
          <p className="text-xs text-[#737373] truncate w-48 sm:w-auto">
            {personal.githubUrl || 'Not added'}
          </p>
        </div>
      </a>
    </div>
  );
}

/**
 * Section 3: Profile Summary & Edit Form
 */
export function PersonalInformationCard({ 
  profile,
  isEditing, 
  isSaving = false,
  onSave, 
  onCancel 
}: { 
  profile: ProfileData; 
  isEditing: boolean; 
  isSaving?: boolean;
  onSave: (updated: PersonalInformation) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState<PersonalInformation>(profile.personal);

  useEffect(() => {
    setFormData(profile.personal);
  }, [profile.personal, isEditing]);

  const handleChange = (field: keyof PersonalInformation, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.mobile.trim()) {
      alert('Full Name and Mobile are required.');
      return;
    }
    onSave(formData);
  };

  if (!isEditing) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Personal Details */}
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-sm font-bold text-[#171717] mb-6 flex items-center gap-2">
            <User className="h-4 w-4 text-[#FF8A00]" /> Personal Details
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">Date of Birth</span>
                <span className="text-xs font-semibold text-[#171717]">{profile.personal.dateOfBirth || 'Not configured'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">Gender</span>
                <span className="text-xs font-semibold text-[#171717]">{profile.personal.gender || 'Not configured'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Internship Details */}
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-sm font-bold text-[#171717] mb-6 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[#FF8A00]" /> Internship Details
          </h3>
          <div className="space-y-4">
            <div>
              <span className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">Problem Statement</span>
              <span className="text-xs font-semibold text-[#171717] bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100">{profile.internship.problemStatement}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">Intern ID</span>
                <span className="text-xs font-mono font-semibold text-[#171717]">{profile.personal.internId}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">Assigned Admin</span>
                <span className="text-xs font-semibold text-[#171717]">{profile.internship.assignedAdmin}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">Internship Dates</span>
                <span className="text-xs font-semibold text-[#171717]">
                  {profile.internship.internshipStartDate ? `${profile.internship.internshipStartDate} to ${profile.internship.internshipEndDate}` : 'Not configured'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">Duration</span>
                <span className="text-xs font-semibold text-[#171717]">{profile.internship.duration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit Form
  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 sm:p-8 shadow-sm mt-6">
      <div className="flex justify-between items-center border-b border-[#EDEDED] pb-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-[#171717]">Edit Profile Details</h3>
          <p className="text-xs text-[#737373] mt-0.5">Update your personal and professional information.</p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="font-bold text-[#171717] block mb-1.5">Full Name *</label>
            <input type="text" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="w-full p-3 rounded-xl border border-[#EDEDED] bg-[#FAFAFA] text-[#171717] focus:ring-2 focus:ring-[#FF8A00] outline-none" required />
          </div>
          <div>
            <label className="font-bold text-[#737373] block mb-1.5">Registered Email (Read-Only)</label>
            <input type="email" disabled value={formData.email} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="font-bold text-[#171717] block mb-1.5">Mobile Number *</label>
            <input type="text" value={formData.mobile} onChange={(e) => handleChange('mobile', e.target.value)} className="w-full p-3 rounded-xl border border-[#EDEDED] bg-[#FAFAFA] text-[#171717] focus:ring-2 focus:ring-[#FF8A00] outline-none" required />
          </div>
          <div>
            <label className="font-bold text-[#171717] block mb-1.5">Date of Birth</label>
            <input type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} className="w-full p-3 rounded-xl border border-[#EDEDED] bg-[#FAFAFA] text-[#171717] focus:ring-2 focus:ring-[#FF8A00] outline-none" />
          </div>
          <div>
            <label className="font-bold text-[#171717] block mb-1.5">Gender</label>
            <select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} className="w-full p-3 rounded-xl border border-[#EDEDED] bg-[#FAFAFA] text-[#171717] focus:ring-2 focus:ring-[#FF8A00] outline-none">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-[#171717] block mb-1.5">City</label>
            <input type="text" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} className="w-full p-3 rounded-xl border border-[#EDEDED] bg-[#FAFAFA] text-[#171717] focus:ring-2 focus:ring-[#FF8A00] outline-none" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="font-bold text-[#171717] block mb-1.5 flex items-center gap-1"><Link className="h-3 w-3"/> LinkedIn URL</label>
              <input type="url" placeholder="https://linkedin.com/in/username" value={formData.linkedInUrl} onChange={(e) => handleChange('linkedInUrl', e.target.value)} className="w-full p-3 rounded-xl border border-[#EDEDED] bg-[#FAFAFA] text-[#171717] focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="font-bold text-[#171717] block mb-1.5 flex items-center gap-1"><Link className="h-3 w-3"/> GitHub URL</label>
              <input type="url" placeholder="https://github.com/username" value={formData.githubUrl} onChange={(e) => handleChange('githubUrl', e.target.value)} className="w-full p-3 rounded-xl border border-[#EDEDED] bg-[#FAFAFA] text-[#171717] focus:ring-2 focus:ring-gray-700 outline-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#EDEDED]">
          <button type="button" onClick={onCancel} disabled={isSaving} className="px-5 py-2.5 bg-gray-100 text-[#171717] hover:bg-gray-200 border border-gray-200 font-bold text-xs rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-[#171717] text-white font-bold text-xs rounded-xl shadow-md hover:bg-black flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
