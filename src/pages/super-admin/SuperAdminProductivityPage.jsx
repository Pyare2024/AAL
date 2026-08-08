import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ManagementFilterBar } from '../../components/common/ManagementFilterBar';
import { 
  fetchDailyDiariesForSuperAdmin, 
  reviewDailyDiary 
} from '../../services/dailyDiaryService';
import { 
  fetchAttendanceLogsForSuperAdmin 
} from '../../services/attendanceLocationService';
import { 
  Calendar, 
  Clock, 
  FileText, 
  MapPin, 
  CheckCircle2, 
  Search,
  Filter,
  MessageSquare,
  Send,
  Award,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export function SuperAdminProductivityPage() {
  const navigate = useNavigate();
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

  // Attendance & Daily Diary State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [diaries, setDiaries] = useState([]);
  const [loadingDiaries, setLoadingDiaries] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const collegeOptions = ['GCOEJ Jalgaon', 'COEP Pune', 'VJTI Mumbai', 'PICT Pune'];
  const cityOptions = ['Jalgaon', 'Pune', 'Mumbai', 'Nagpur', 'Nashik'];
  const statusOptions = ['Present', 'Absent', 'Late', 'Geofence_Violated', 'Pending Review'];

  useEffect(() => {
    if (activeSubmodule === 'attendance') {
      loadAttendanceLogs();
    } else if (activeSubmodule === 'daily-diary') {
      loadDailyDiaries();
    }
  }, [activeSubmodule, filters]);

  const loadAttendanceLogs = async () => {
    setLoadingAttendance(true);
    try {
      const data = await fetchAttendanceLogsForSuperAdmin(filters);
      const formatted = data.map(item => ({
        id: item.id || `att-${Math.random()}`,
        internName: item.profiles?.full_name || 'Intern User',
        email: item.profiles?.email || 'intern@asg.com',
        problemStatement: item.problem_statements?.title || 'Allocated Problem Statement',
        date: item.date || (item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        checkInTime: item.check_in_time || '09:00 AM',
        checkOutTime: item.check_out_time || 'In Progress',
        distanceMeters: item.distance_meters || 0,
        status: item.status || 'Present',
        locationName: item.attendance_locations?.location_name || 'Innovation Campus'
      }));
      setAttendanceRecords(formatted);
    } catch (err) {
      console.error('[SuperAdminProductivity] Error fetching attendance:', err);
      setAttendanceRecords([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const loadDailyDiaries = async () => {
    setLoadingDiaries(true);
    try {
      const data = await fetchDailyDiariesForSuperAdmin(filters);
      setDiaries(data);
    } catch (err) {
      console.error('[SuperAdminProductivity] Error fetching diaries:', err);
      setDiaries([]);
    } finally {
      setLoadingDiaries(false);
    }
  };

  const handleOpenDiaryReview = (diary) => {
    setSelectedDiary(diary);
    setFeedbackText(diary.admin_feedback || '');
    setFeedbackSuccess(false);
  };

  const handleSendFeedback = async () => {
    if (!selectedDiary) return;
    setSubmittingFeedback(true);
    try {
      const res = await reviewDailyDiary(selectedDiary.id, {
        status: 'Reviewed',
        feedback: feedbackText
      });
      if (res.success) {
        setFeedbackSuccess(true);
        setTimeout(() => {
          setSelectedDiary(null);
          loadDailyDiaries();
        }, 1000);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filteredAttendance = attendanceRecords.filter(item => 
    !filters.search || 
    item.internName.toLowerCase().includes(filters.search.toLowerCase()) || 
    item.email.toLowerCase().includes(filters.search.toLowerCase())
  );

  const submodules = [
    { id: 'attendance', label: 'Attendance Management', icon: Calendar, count: attendanceRecords.length },
    { id: 'daily-diary', label: 'Daily Diary Review', icon: FileText, count: diaries.length },
    { id: 'pending-work', label: 'Pending Work', icon: Clock, count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <Award className="h-3.5 w-3.5" />
            <span>Super Admin Productivity Control Center</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Productivity Hub</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Manage attendance location rules, monitor GPS check-ins, review daily diaries, and track pending work.
          </p>
        </div>

        {/* Action Button to Manage Location Geofences */}
        <button
          onClick={() => navigate('/super-admin/attendance/locations')}
          className="px-4 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl text-xs font-bold shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          <span>Configure GPS Attendance Locations</span>
        </button>
      </div>

      {/* Submodule Overview Grid Cards */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider">Productivity Submodules</h2>
          <span className="text-xs text-[#9A9A9A]">Select a module to inspect intern records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        placeholderSearch="Search Productivity records by Intern Name or Email..."
      />

      {/* Workspace Content */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
        {/* SUBMODULE 1: ATTENDANCE MANAGEMENT */}
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
                <p className="text-xs text-[#9A9A9A]">Coordinates, geofence radius, and device IP captured during mark attendance.</p>
              </div>

              <button
                onClick={() => navigate('/super-admin/attendance/locations')}
                className="px-3.5 py-1.5 bg-[#F7F7F7] hover:bg-[#EDEDED] border border-[#EDEDED] text-[#0D0D0D] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <MapPin className="h-3.5 w-3.5 text-[#FF8A00]" />
                <span>Geofence Settings</span>
              </button>
            </div>

            <div className="space-y-3">
              {filteredAttendance.map((item) => (
                <div key={item.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white transition-all">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#0D0D0D]">{item.internName}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.status === 'Present' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : item.status === 'Late' ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-rose-100 text-rose-700 border border-rose-300'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EDEDED] text-[#0D0D0D] rounded flex items-center gap-1">
                        📍 {item.locationName} ({item.distanceMeters}m distance)
                      </span>
                    </div>
                    <p className="text-xs text-[#9A9A9A]">{item.email} | Date: {item.date} | Check-in: <strong className="text-emerald-700">{item.checkInTime}</strong> | Check-out: <strong className="text-[#0D0D0D]">{item.checkOutTime}</strong></p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => navigate('/super-admin/attendance/locations')}
                      className="px-3 py-1.5 bg-white border border-[#EDEDED] hover:border-[#FF8A00] text-xs font-bold rounded-xl text-[#0D0D0D] flex items-center gap-1 shadow-sm"
                    >
                      Inspect Geofence Rules
                    </button>
                  </div>
                </div>
              ))}

              {filteredAttendance.length === 0 && (
                <div className="p-8 text-center text-[#9A9A9A] text-xs">
                  No live attendance logs recorded in database yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBMODULE 2: DAILY DIARY REVIEW */}
        {activeSubmodule === 'daily-diary' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Platform-Wide Daily Diary Submissions</h2>
            <div className="space-y-3">
              {diaries.map((diary) => (
                <div key={diary.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-[#0D0D0D]">
                      {diary.profiles?.full_name || 'Intern'} - <span className="text-[#FF8A00]">{diary.title}</span>
                    </h4>
                    <span className="text-[10px] font-semibold text-[#9A9A9A]">{diary.diary_date || diary.date}</span>
                  </div>
                  <p className="text-xs text-[#4A4A4A] leading-relaxed">{diary.tasks_completed}</p>
                  {diary.challenges && <p className="text-[11px] text-amber-700"><strong>Challenges: </strong>{diary.challenges}</p>}
                  
                  {diary.admin_feedback && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg">
                      <strong>Admin Feedback: </strong>{diary.admin_feedback}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenDiaryReview(diary)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-95 flex items-center gap-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{diary.status === 'Reviewed' ? 'Edit Feedback' : 'Review Entry'}</span>
                    </button>
                  </div>
                </div>
              ))}

              {diaries.length === 0 && (
                <div className="p-8 text-center text-[#9A9A9A] text-xs">
                  No daily diary submissions found in database.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBMODULE 3: PENDING WORK */}
        {activeSubmodule === 'pending-work' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Pending Work Submissions</h2>
            <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs space-y-2 text-center text-[#9A9A9A]">
              No pending work submissions awaiting review.
            </div>
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      {selectedDiary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#0D0D0D]">Review Intern Daily Diary</h3>
                <p className="text-xs text-[#9A9A9A]">Intern: {selectedDiary.profiles?.full_name || 'Intern'}</p>
              </div>
              <button 
                onClick={() => setSelectedDiary(null)}
                className="text-[#9A9A9A] hover:text-[#0D0D0D] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#FAFAFA] border border-[#EDEDED] rounded-xl p-4 text-xs space-y-2 max-h-60 overflow-y-auto">
              <p className="font-extrabold text-sm text-[#0D0D0D]">{selectedDiary.title}</p>
              <p><strong className="text-[#0D0D0D]">Date: </strong>{selectedDiary.diary_date || selectedDiary.date}</p>
              <p><strong className="text-[#0D0D0D]">Tasks Completed: </strong>{selectedDiary.tasks_completed}</p>
              {selectedDiary.challenges && <p><strong className="text-amber-700">Challenges: </strong>{selectedDiary.challenges}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0D0D0D] block">
                Super Admin Feedback (Visible to Intern & Admin)
              </label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Enter feedback or performance guidance..."
                className="w-full p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
              />
            </div>

            {feedbackSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Feedback submitted successfully!</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDiary(null)}
                className="px-4 py-2 border border-[#EDEDED] text-[#0D0D0D] rounded-xl text-xs font-bold hover:bg-[#F7F7F7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendFeedback}
                disabled={submittingFeedback}
                className="px-5 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{submittingFeedback ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
