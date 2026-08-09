import React from 'react';
import { Sliders, Bell, Shield, Moon, Monitor, Check } from 'lucide-react';

export function AdminSettingsPage() {
  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <span>Role Access: Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Settings</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Manage your interface preferences and application settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation/Tabs (Visual only for Settings structure) */}
        <div className="col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-[#FF8A00] text-white shadow-sm transition-colors text-left">
            <Sliders className="h-4 w-4" />
            General Preferences
          </button>
          <button disabled className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#9A9A9A] hover:bg-[#F7F7F7] hover:text-[#0D0D0D] transition-colors text-left cursor-not-allowed opacity-60">
            <Bell className="h-4 w-4" />
            Notifications
          </button>
          <button disabled className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#9A9A9A] hover:bg-[#F7F7F7] hover:text-[#0D0D0D] transition-colors text-left cursor-not-allowed opacity-60">
            <Shield className="h-4 w-4" />
            Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          {/* Appearance Section */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EDEDED] bg-[#F7F7F7]">
              <h3 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider">Appearance</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#9A9A9A] mb-4">Choose how the AI APEX Admin Console looks to you.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-4 rounded-xl border-2 border-[#FF8A00] bg-[#FFF7ED] text-left transition-all">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-[#FF8A00]" />
                    <div>
                      <p className="text-sm font-bold text-[#0D0D0D]">Light Mode</p>
                      <p className="text-xs text-[#9A9A9A]">Clean and bright</p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-[#FF8A00] flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </button>
                
                <button disabled className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#EDEDED] bg-white opacity-50 cursor-not-allowed text-left">
                  <Moon className="h-5 w-5 text-[#9A9A9A]" />
                  <div>
                    <p className="text-sm font-bold text-[#0D0D0D]">Dark Mode</p>
                    <p className="text-xs text-[#9A9A9A]">Coming soon</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Local Toggles */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EDEDED] bg-[#F7F7F7]">
              <h3 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider">Local Preferences</h3>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex items-center justify-between opacity-60">
                <div>
                  <p className="text-sm font-bold text-[#0D0D0D]">In-App Notifications</p>
                  <p className="text-xs text-[#9A9A9A] mt-0.5">Show toast notifications when data updates.</p>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 bg-[#F7F7F7] text-[#9A9A9A] rounded-md border border-[#EDEDED]">
                  Unavailable
                </div>
              </div>

              <div className="w-full h-px bg-[#EDEDED]" />
              
              <div className="flex items-center justify-between opacity-60">
                <div>
                  <p className="text-sm font-bold text-[#0D0D0D]">Email Alerts</p>
                  <p className="text-xs text-[#9A9A9A] mt-0.5">Receive summary reports via email.</p>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 bg-[#F7F7F7] text-[#9A9A9A] rounded-md border border-[#EDEDED]">
                  Unavailable
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
