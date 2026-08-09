import React from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { User, Mail, Phone, ShieldCheck, Key } from 'lucide-react';

export function AdminProfilePage() {
  const { user, profile } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  if (!profile) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-sm font-semibold text-[#9A9A9A]">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <span>Role Access: Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">My Profile</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Manage your personal information and account settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF3D00] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#FF3D00]/20 mb-4">
              {getInitials(profile.full_name)}
            </div>
            <h2 className="text-xl font-extrabold text-[#0D0D0D]">{profile.full_name || 'Admin User'}</h2>
            <p className="text-sm font-medium text-[#9A9A9A] mb-4">{profile.email}</p>
            
            <div className="w-full px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-2 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{profile.account_status || 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EDEDED] bg-[#F7F7F7]">
              <h3 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider">Account Details</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-[#9A9A9A] mb-1">
                    <User className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Full Name</span>
                  </div>
                  <p className="text-sm font-semibold text-[#0D0D0D] bg-[#F7F7F7] px-4 py-2.5 rounded-xl border border-[#EDEDED]">
                    {profile.full_name || 'Not provided'}
                  </p>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-[#9A9A9A] mb-1">
                    <Key className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Role</span>
                  </div>
                  <p className="text-sm font-semibold text-[#0D0D0D] bg-[#F7F7F7] px-4 py-2.5 rounded-xl border border-[#EDEDED] capitalize">
                    {profile.role || 'Admin'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-[#9A9A9A] mb-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Email Address</span>
                  </div>
                  <p className="text-sm font-semibold text-[#0D0D0D] bg-[#F7F7F7] px-4 py-2.5 rounded-xl border border-[#EDEDED]">
                    {profile.email || 'Not provided'}
                  </p>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-[#9A9A9A] mb-1">
                    <Phone className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Mobile Number</span>
                  </div>
                  <p className="text-sm font-semibold text-[#0D0D0D] bg-[#F7F7F7] px-4 py-2.5 rounded-xl border border-[#EDEDED]">
                    {profile.mobile || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-[#EDEDED]">
                <p className="text-xs text-[#9A9A9A] italic">
                  * Note: Profile information is managed by the Super Admin. Please contact support to request changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
