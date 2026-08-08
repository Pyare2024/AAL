import React, { useState } from 'react';
import { AdminAttendanceReviewPage } from './AdminAttendanceReviewPage';
import { AdminDailyDiaryReviewPage } from './AdminDailyDiaryReviewPage';
import { AdminPendingWorkReviewPage } from './AdminPendingWorkReviewPage';
import { Calendar, FileText, Clock, Award, ShieldCheck } from 'lucide-react';

export function AdminProductivityPage() {
  const [activeTab, setActiveTab] = useState('attendance');

  const tabs = [
    { id: 'attendance', label: 'Attendance Review', icon: Calendar },
    { id: 'daily-diary', label: 'Daily Diary Review', icon: FileText },
    { id: 'pending-work', label: 'Pending Work', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF8A00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF8A00] mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin Productivity Management</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Productivity Hub</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Review live attendance logs, evaluate daily progress diaries, and inspect pending work for your allocated interns.
          </p>
        </div>
      </div>

      {/* Submodule Navigation Tabs */}
      <div className="flex border-b border-[#EDEDED] gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white shadow-md shadow-[#FF3D00]/20'
                : 'bg-white border border-[#EDEDED] text-[#0D0D0D] hover:bg-[#F7F7F7]'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Workspace View */}
      <div>
        {activeTab === 'attendance' && <AdminAttendanceReviewPage />}
        {activeTab === 'daily-diary' && <AdminDailyDiaryReviewPage />}
        {activeTab === 'pending-work' && <AdminPendingWorkReviewPage />}
      </div>
    </div>
  );
}
