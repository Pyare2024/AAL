import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ManagementFilterBar } from '../../components/common/ManagementFilterBar';
import { 
  Calendar, 
  Clock, 
  FileText, 
  CheckSquare, 
  AlertCircle, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Search,
  Check,
  X,
  MessageSquare
} from 'lucide-react';

export function OperationsManagementPage() {
  const [activeSubmodule, setActiveSubmodule] = useState('attendance');

  // Filter Bar State
  const initialFilters = {
    search: '',
    problemStatement: 'all',
    college: 'all',
    city: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  };
  const [filters, setFilters] = useState(initialFilters);

  const collegeOptions = ['GCOEJ Jalgaon', 'COEP Pune', 'VJTI Mumbai', 'PICT Pune'];
  const cityOptions = ['Jalgaon', 'Pune', 'Mumbai', 'Nagpur', 'Nashik'];
  const statusOptions = ['Present', 'Absent', 'Late', 'On Leave', 'Pending Review'];

  // Sample Operations Data
  const sampleAttendanceRecords = [
    { id: 'att-1', internName: 'Aarav Sharma', email: 'aarav.sharma@asg.com', date: 'Jul 28, 2026', checkInTime: '09:15 AM', status: 'Present', college: 'GCOEJ Jalgaon' },
    { id: 'att-2', internName: 'Ananya Verma', email: 'ananya.v@asg.com', date: 'Jul 28, 2026', checkInTime: '09:42 AM', status: 'Late', college: 'COEP Pune' },
    { id: 'att-3', internName: 'Rohan Deshmukh', email: 'rohan.d@asg.com', date: 'Jul 28, 2026', checkInTime: '-', status: 'On Leave', college: 'VJTI Mumbai' },
  ];

  const sampleDailyDiaries = [
    { id: 'dry-1', internName: 'Aarav Sharma', date: 'Jul 28, 2026', title: 'Agentic AI Workflow Node Debugging', status: 'Submitted', summary: 'Implemented node graph state persistence using TanStack query and Supabase RLS.' },
    { id: 'dry-2', internName: 'Ananya Verma', date: 'Jul 28, 2026', title: 'Swarm Orchestrator Refactoring', status: 'Submitted', summary: 'Optimized swarm leadership election logic using Raft consensus protocol.' },
  ];

  const samplePendingLeaves = [
    { id: 'lev-1', internName: 'Rohan Deshmukh', dateRange: 'Jul 28 - Jul 30, 2026', reason: 'Medical Checkup & Recovery', status: 'Pending Review' },
  ];

  const filteredAttendance = sampleAttendanceRecords.filter(item => 
    !filters.search || 
    item.internName.toLowerCase().includes(filters.search.toLowerCase()) || 
    item.email.toLowerCase().includes(filters.search.toLowerCase())
  );

  const submodules = [
    { id: 'attendance', label: 'Attendance Management', icon: Calendar, count: sampleAttendanceRecords.length },
    { id: 'daily-diary', label: 'Daily Diary Review', icon: FileText, count: sampleDailyDiaries.length },
    { id: 'todo-monitoring', label: 'To-do Monitoring', icon: CheckSquare, count: 5 },
    { id: 'pending-work', label: 'Pending Work Management', icon: Clock, count: 3 },
    { id: 'leave', label: 'Leave Management', icon: AlertCircle, count: samplePendingLeaves.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>Operations & Monitoring Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Operations</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Monitor daily attendance, review intern diaries, track pending tasks, and manage leave approvals.
          </p>
        </div>
      </div>

      {/* Submodule Overview Grid Cards */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider">Operations Submodules</h2>
          <span className="text-xs text-[#9A9A9A]">Select a card to manage operational tasks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {submodules.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubmodule(sub.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 group ${
                activeSubmodule === sub.id
                  ? 'bg-white border-[#FF8A00] shadow-md ring-2 ring-[#FF8A00]/20'
                  : 'bg-white border-[#EDEDED] hover:border-[#FF8A00]/40 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <div className={`p-2.5 rounded-xl transition-colors ${
                  activeSubmodule === sub.id ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white' : 'bg-[#F7F7F7] text-[#FF8A00] group-hover:bg-[#FF8A00]/10'
                }`}>
                  <sub.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-black px-2 py-0.5 bg-[#F7F7F7] border border-[#EDEDED] text-[#0D0D0D] rounded-full">
                  {sub.count}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#0D0D0D] group-hover:text-[#FF8A00] transition-colors">{sub.label}</h3>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Common Reusable Filter Bar */}
      <ManagementFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        collegeOptions={collegeOptions}
        cityOptions={cityOptions}
        statusOptions={statusOptions}
        placeholderSearch="Search Operations records by Intern Name or Email..."
      />

      {/* Main Submodule Content Workspace */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
        {/* SUBMODULE 1: ATTENDANCE MANAGEMENT (LIVE GPS LOCATION VERIFIED) */}
        {activeSubmodule === 'attendance' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#EDEDED] pb-3 gap-2">
              <div>
                <h2 className="text-base font-bold text-[#0D0D0D] flex items-center gap-2">
                  <span>Live GPS Verified Attendance Logs</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    LIVE GEO-LOCATED
                  </span>
                </h2>
                <p className="text-xs text-[#9A9A9A]">Coordinates, geofence status, and device IP captured during mark attendance.</p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Geo-Fence Active (Radius: 500m)
              </span>
            </div>

            <div className="space-y-3">
              {filteredAttendance.map((item) => (
                <div key={item.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white transition-all">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#0D0D0D]">{item.internName}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : item.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EDEDED] text-[#0D0D0D] rounded flex items-center gap-1">
                        📍 Live GPS Verified
                      </span>
                    </div>
                    <p className="text-xs text-[#9A9A9A]">{item.email} | Date: {item.date} | Check-in: <strong className="text-[#0D0D0D]">{item.checkInTime}</strong></p>
                    
                    {/* Live Geo Coordinates Tag */}
                    <div className="flex items-center gap-3 text-[11px] text-[#9A9A9A] pt-1">
                      <span className="font-semibold text-[#0D0D0D]">Location: <strong className="text-[#FF8A00]">20.9980° N, 75.5667° E</strong> (Jalgaon HQ)</span>
                      <span>Accuracy: <strong>±4 meters</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button className="px-3 py-1.5 bg-white border border-[#EDEDED] hover:border-[#FF8A00] text-xs font-bold rounded-xl text-[#0D0D0D] flex items-center gap-1 shadow-sm">
                      Inspect Map Pin 📍
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-[#EDEDED] hover:border-[#FF3D00] text-xs font-bold rounded-xl text-[#0D0D0D]">
                      Override Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMODULE 2: DAILY DIARY REVIEW */}
        {activeSubmodule === 'daily-diary' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Daily Diary Submissions Review</h2>
            <div className="space-y-3">
              {sampleDailyDiaries.map((diary) => (
                <div key={diary.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-[#0D0D0D]">{diary.internName} - <span className="text-[#FF8A00]">{diary.title}</span></h4>
                    <span className="text-[10px] font-semibold text-[#9A9A9A]">{diary.date}</span>
                  </div>
                  <p className="text-xs text-[#9A9A9A] leading-relaxed">{diary.summary}</p>
                  <div className="pt-2 flex justify-end gap-2">
                    <button className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1">
                      <Check className="h-3 w-3" /> Approve Diary
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMODULE 3: TO-DO MONITORING */}
        {activeSubmodule === 'todo-monitoring' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Intern Daily To-do Monitoring</h2>
            <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs space-y-2">
              <p className="font-bold text-[#0D0D0D]">Aarav Sharma - Task Checklist:</p>
              <ul className="list-disc pl-5 text-[#9A9A9A] space-y-1">
                <li className="text-emerald-600 font-semibold">✓ Setup Supabase Auth RLS policy</li>
                <li className="text-emerald-600 font-semibold">✓ Run initial database migration script</li>
                <li>Connect ManagementFilterBar component</li>
              </ul>
            </div>
          </div>
        )}

        {/* SUBMODULE 4: PENDING WORK MANAGEMENT */}
        {activeSubmodule === 'pending-work' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Overdue & Pending Work Tracking</h2>
            <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex justify-between items-center text-xs">
              <div>
                <h4 className="font-bold text-[#0D0D0D]">Ananya Verma</h4>
                <p className="text-[#9A9A9A]">Pending Submission: Module 4 Code Audit</p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-md font-bold">1 Day Overdue</span>
            </div>
          </div>
        )}

        {/* SUBMODULE 5: LEAVE MANAGEMENT */}
        {activeSubmodule === 'leave' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Intern Leave Applications</h2>
            <div className="space-y-3">
              {samplePendingLeaves.map((leave) => (
                <div key={leave.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[#0D0D0D]">{leave.internName}</h4>
                    <p className="text-xs text-[#9A9A9A]">Dates: <strong>{leave.dateRange}</strong> | Reason: {leave.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold rounded-lg">Approve Leave</button>
                    <button className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
