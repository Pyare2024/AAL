import React, { useState } from 'react';
import { User, Camera, ShieldCheck, Mail, Briefcase, UserCheck, AlertCircle, Edit2, Save, X } from 'lucide-react';
import { ProfileData, PersonalInformation } from '../../types/profileTypes';

/**
 * Section 1: Profile Header Component
 * Displays avatar, full name, intern ID, email, problem statement, assigned admin, status badge, completion bar, and Edit Profile toggle button.
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
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Left Avatar & Core Identifiers */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left w-full sm:w-auto">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#FF8A00]/20 to-orange-100 border-2 border-[#FF8A00] flex items-center justify-center overflow-hidden shadow-sm">
              {photoPreview ? (
                <img src={photoPreview} alt={profile.personal.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-[#FF8A00]" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-white border border-[#EDEDED] p-1.5 rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition-colors">
              <Camera className="h-4 w-4 text-[#737373]" />
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">{profile.personal.fullName}</h2>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full uppercase">
                {profile.internship.status}
              </span>
            </div>

            <p className="text-xs font-mono text-[#737373]">
              Intern ID: <span className="font-bold text-[#171717]">{profile.personal.internId}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#737373] pt-1">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#FF8A00]" />
                <span>{profile.personal.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Admin: <strong className="text-[#171717]">{profile.internship.assignedAdmin}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Edit Action & Completion Bar */}
        <div className="w-full md:w-auto flex flex-col items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-[#EDEDED]">
          <button
            onClick={onToggleEdit}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
              isEditing 
                ? 'bg-gray-100 text-[#171717] hover:bg-gray-200 border border-gray-300' 
                : 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white hover:opacity-95'
            }`}
          >
            {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>

          <div className="w-full sm:w-64 bg-[#FAFAFA] border border-[#EDEDED] p-3 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#737373]">Profile Completion</span>
              <span className="font-bold text-[#FF8A00]">{profile.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] h-full rounded-full" style={{ width: `${profile.completionPercentage}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement Card Banner */}
      <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl flex items-start gap-3 text-xs">
        <Briefcase className="h-4 w-4 text-[#FF8A00] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#737373] uppercase text-[10px] block">Problem Statement Track</span>
          <p className="font-semibold text-[#171717] mt-0.5 leading-relaxed">{profile.internship.problemStatement}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Section 2: Personal Information Card Component (Supports View & Edit Modes)
 */
export function PersonalInformationCard({ 
  personal, 
  isEditing, 
  onSave, 
  onCancel 
}: { 
  personal: PersonalInformation; 
  isEditing: boolean; 
  onSave: (updated: PersonalInformation) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState<PersonalInformation>(personal);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (field: keyof PersonalInformation, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!formData.mobile.trim()) {
      setErrorMsg('Mobile Number is required.');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
        <div>
          <h3 className="text-base font-bold text-[#171717]">Personal Information</h3>
          <p className="text-xs text-[#737373] mt-0.5">Contact details and personal profile parameters.</p>
        </div>
        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
          isEditing ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-gray-100 text-gray-600 border-gray-200'
        }`}>
          {isEditing ? 'Edit Mode' : 'View Mode'}
        </span>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Full Name */}
          <div>
            <label className="font-bold text-[#171717] block mb-1">Full Name *</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className={`w-full p-3 rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none ${
                isEditing ? 'bg-[#FAFAFA] border border-[#EDEDED] text-[#171717]' : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-not-allowed'
              }`}
              required
            />
          </div>

          {/* Email (Read Only) */}
          <div>
            <label className="font-bold text-[#737373] block mb-1">Registered Email (Read-Only)</label>
            <input
              type="email"
              disabled
              value={formData.email}
              className="w-full p-3 rounded-xl text-xs bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Intern ID (Read Only) */}
          <div>
            <label className="font-bold text-[#737373] block mb-1">Intern ID (Read-Only)</label>
            <input
              type="text"
              disabled
              value={formData.internId}
              className="w-full p-3 rounded-xl text-xs bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="font-bold text-[#171717] block mb-1">Mobile Number *</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
              className={`w-full p-3 rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none ${
                isEditing ? 'bg-[#FAFAFA] border border-[#EDEDED] text-[#171717]' : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-not-allowed'
              }`}
              required
            />
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="font-bold text-[#171717] block mb-1">WhatsApp Number</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.whatsappNumber}
              onChange={(e) => handleChange('whatsappNumber', e.target.value)}
              className={`w-full p-3 rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none ${
                isEditing ? 'bg-[#FAFAFA] border border-[#EDEDED] text-[#171717]' : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="font-bold text-[#171717] block mb-1">Date of Birth</label>
            <input
              type="date"
              disabled={!isEditing}
              value={formData.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              className={`w-full p-3 rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none ${
                isEditing ? 'bg-[#FAFAFA] border border-[#EDEDED] text-[#171717]' : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Gender */}
          <div>
            <label className="font-bold text-[#171717] block mb-1">Gender</label>
            <select
              disabled={!isEditing}
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className={`w-full p-3 rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none ${
                isEditing ? 'bg-[#FAFAFA] border border-[#EDEDED] text-[#171717]' : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-not-allowed'
              }`}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* City */}
          <div>
            <label className="font-bold text-[#171717] block mb-1">City</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className={`w-full p-3 rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none ${
                isEditing ? 'bg-[#FAFAFA] border border-[#EDEDED] text-[#171717]' : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-not-allowed'
              }`}
            />
          </div>

          {/* State */}
          <div>
            <label className="font-bold text-[#171717] block mb-1">State</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className={`w-full p-3 rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none ${
                isEditing ? 'bg-[#FAFAFA] border border-[#EDEDED] text-[#171717]' : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-not-allowed'
              }`}
            />
          </div>
        </div>

        {/* Professional Bio */}
        <div>
          <label className="font-bold text-[#171717] block mb-1">Short Professional Bio</label>
          <textarea
            disabled={!isEditing}
            value={formData.professionalBio}
            onChange={(e) => handleChange('professionalBio', e.target.value)}
            rows={3}
            className={`w-full p-3 rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none leading-relaxed ${
              isEditing ? 'bg-[#FAFAFA] border border-[#EDEDED] text-[#171717]' : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-not-allowed'
            }`}
          />
        </div>

        {/* Action Buttons in Edit Mode */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-3 border-t border-[#EDEDED]">
            <button
              type="button"
              onClick={() => {
                setFormData(personal);
                onCancel();
              }}
              className="px-4 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] text-[#171717] font-bold text-xs rounded-xl"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
