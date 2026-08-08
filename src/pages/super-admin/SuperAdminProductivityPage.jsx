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
  fetchPendingWorkForSuperAdmin,
  reviewPendingWork,
  broadcastPendingTaskAssignment,
  fetchBroadcastTaskAssignments,
  deleteTaskAssignment,
  deleteWorkSubmission
} from '../../services/pendingWorkService';
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
  AlertTriangle,
  User,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Check,
  XCircle,
  Star,
  Plus,
  FolderPlus,
  Megaphone,
  Trash2
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

  // Module Data States
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [diaries, setDiaries] = useState([]);
  const [loadingDiaries, setLoadingDiaries] = useState(false);

  const [pendingWorkList, setPendingWorkList] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState([]);
  const [loadingWork, setLoadingWork] = useState(false);

  // Selected Student Diary Drawer / Modal State
  const [selectedStudentDiaries, setSelectedStudentDiaries] = useState(null);
  const [selectedDiaryForFeedback, setSelectedDiaryForFeedback] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Selected Pending Work Review Modal State
  const [selectedWorkForReview, setSelectedWorkForReview] = useState(null);
  const [workGrade, setWorkGrade] = useState('A+');
  const [workStatus, setWorkStatus] = useState('Approved');
  const [workFeedback, setWorkFeedback] = useState('');
  const [submittingWorkReview, setSubmittingWorkReview] = useState(false);
  const [workReviewSuccess, setWorkReviewSuccess] = useState(false);

  // Broadcast Task Assignment Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskInstructions, setNewTaskInstructions] = useState('');
  const [newTaskDriveUrl, setNewTaskDriveUrl] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const collegeOptions = ['GCOEJ Jalgaon', 'COEP Pune', 'VJTI Mumbai', 'PICT Pune'];
  const cityOptions = ['Jalgaon', 'Pune', 'Mumbai', 'Nagpur', 'Nashik'];
  const statusOptions = ['Present', 'Absent', 'Late', 'Pending Review', 'Approved', 'Revision Requested'];

  useEffect(() => {
    if (activeSubmodule === 'attendance') {
      loadAttendanceLogs();
    } else if (activeSubmodule === 'daily-diary') {
      loadDailyDiaries();
    } else if (activeSubmodule === 'pending-work') {
      loadPendingWork();
    }
  }, [activeSubmodule, filters]);

  const loadAttendanceLogs = async () => {
    setLoadingAttendance(true);
    try {
      const data = await fetchAttendanceLogsForSuperAdmin(filters);
      const formatted = data.map(item => ({
        id: item.id || `att-${Math.random()}`,
        internName: item.profiles?.full_name || item.internName || 'Intern User',
        email: item.profiles?.email || item.email || 'intern@asg.com',
        problemStatement: item.problem_statements?.title || item.problemStatement || 'Allocated Problem Statement',
        date: item.date || (item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        checkInTime: item.check_in_time || '09:00 AM',
        checkOutTime: item.check_out_time || 'In Progress',
        distanceMeters: item.distance_meters || 0,
        status: item.status || 'Present',
        locationName: item.attendance_locations?.location_name || item.locationName || 'Innovation Campus'
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

  const loadPendingWork = async () => {
    setLoadingWork(true);
    try {
      const [submissions, assignments] = await Promise.all([
        fetchPendingWorkForSuperAdmin(filters),
        fetchBroadcastTaskAssignments()
      ]);
      setPendingWorkList(submissions);
      setTaskAssignments(assignments);
    } catch (err) {
      console.error('[SuperAdminProductivity] Error fetching pending work:', err);
      setPendingWorkList([]);
      setTaskAssignments([]);
    } finally {
      setLoadingWork(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task assignment?')) return;
    try {
      await deleteTaskAssignment(taskId);
      loadPendingWork();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this student deliverable submission?')) return;
    try {
      await deleteWorkSubmission(submissionId);
      loadPendingWork();
    } catch (err) {
      console.error('Error deleting submission:', err);
    }
  };

  // Group Diaries by Student
  const studentGroups = diaries.reduce((acc, diary) => {
    const studentName = diary.profiles?.full_name || diary.internName || 'Pyarelal Dilip Pawara';
    const email = diary.profiles?.email || diary.email || '2441006@gcoej.ac.in';
    const ps = diary.problem_statements?.title || diary.problemStatement || 'AI Autonomous Agent Launchpad';

    if (!acc[email]) {
      acc[email] = {
        internName: studentName,
        email: email,
        problemStatement: ps,
        diaries: []
      };
    }
    acc[email].diaries.push(diary);
    return acc;
  }, {});

  const studentList = Object.values(studentGroups);

  const handleOpenStudentDiaries = (student) => {
    setSelectedStudentDiaries(student);
    setSelectedDiaryForFeedback(null);
    setFeedbackSuccess(false);
  };

  const handleOpenFeedbackForm = (diary) => {
    setSelectedDiaryForFeedback(diary);
    setFeedbackText(diary.admin_feedback || '');
    setFeedbackSuccess(false);
  };

  const handleSendFeedback = async () => {
    if (!selectedDiaryForFeedback) return;
    setSubmittingFeedback(true);
    try {
      const res = await reviewDailyDiary(selectedDiaryForFeedback.id, {
        status: 'Reviewed',
        feedback: feedbackText
      });
      if (res.success) {
        setFeedbackSuccess(true);
        setTimeout(() => {
          setSelectedDiaryForFeedback(null);
          loadDailyDiaries();
        }, 1000);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleOpenWorkReview = (work) => {
    setSelectedWorkForReview(work);
    setWorkGrade(work.grade || 'A+');
    setWorkStatus(work.status === 'Approved' ? 'Approved' : 'Approved');
    setWorkFeedback(work.admin_feedback || '');
    setWorkReviewSuccess(false);
  };

  const handleSendWorkReview = async () => {
    if (!selectedWorkForReview) return;
    setSubmittingWorkReview(true);
    try {
      const res = await reviewPendingWork(selectedWorkForReview.id, {
        status: workStatus,
        grade: workGrade,
        feedback: workFeedback
      });
      if (res.success) {
        setWorkReviewSuccess(true);
        setTimeout(() => {
          setSelectedWorkForReview(null);
          loadPendingWork();
        }, 1000);
      }
    } catch (err) {
      console.error('Error submitting work review:', err);
    } finally {
      setSubmittingWorkReview(false);
    }
  };

  const handleBroadcastTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setSubmittingBroadcast(true);
    setBroadcastSuccess(false);
    try {
      const res = await broadcastPendingTaskAssignment({
        task_title: newTaskTitle.trim(),
        message_instructions: newTaskInstructions.trim(),
        common_drive_url: newTaskDriveUrl.trim() || 'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9',
        due_date: newTaskDueDate || new Date().toISOString().split('T')[0]
      });

      if (res.success) {
        setBroadcastSuccess(true);
        setTimeout(() => {
          setShowBroadcastModal(false);
          setNewTaskTitle('');
          setNewTaskInstructions('');
          setNewTaskDriveUrl('');
          loadPendingWork();
        }, 1200);
      }
    } catch (err) {
      console.error('Error broadcasting task:', err);
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  const filteredAttendance = attendanceRecords.filter(item => 
    !filters.search || 
    item.internName.toLowerCase().includes(filters.search.toLowerCase()) || 
    item.email.toLowerCase().includes(filters.search.toLowerCase())
  );

  const submodules = [
    { id: 'attendance', label: 'Attendance Management', icon: Calendar, count: attendanceRecords.length },
    { id: 'daily-diary', label: 'Daily Diary Review', icon: FileText, count: studentList.length },
    { id: 'pending-work', label: 'Pending Work', icon: Clock, count: pendingWorkList.length },
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
            Manage attendance location rules, monitor GPS check-ins, review daily diaries, and broadcast pending work tasks.
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
                <span className="text-xs font-black px-2.5 py-0.5 bg-[#F7F7F7] border border-[#EDEDED] text-[#0D0D0D] rounded-full">
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
              {filteredAttendance.map((item, idx) => (
                <div key={item.id ? `${item.id}-${idx}` : `att-idx-${idx}`} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white transition-all">
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
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0D0D0D]">Platform-Wide Daily Diary Submissions</h2>
                <p className="text-xs text-[#9A9A9A]">Click on any student card to view their complete daily diary history.</p>
              </div>
              <span className="text-xs font-bold text-[#FF8A00] bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
                {studentList.length} Active Student Submissions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentList.map((student) => (
                <div 
                  key={student.email} 
                  onClick={() => handleOpenStudentDiaries(student)}
                  className="p-5 bg-[#F7F7F7] border border-[#EDEDED] hover:border-[#FF8A00] rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md space-y-3 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                        {student.internName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0D0D0D] group-hover:text-[#FF8A00] transition-colors">
                          {student.internName}
                        </h4>
                        <p className="text-xs text-[#9A9A9A]">{student.email}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-white border border-[#EDEDED] text-[#0D0D0D] font-extrabold text-[11px] rounded-lg">
                      {student.diaries.length} Submissions
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-[#EDEDED] rounded-xl text-xs space-y-1">
                    <p className="text-[#9A9A9A]">Problem Statement: <strong className="text-[#0D0D0D]">{student.problemStatement}</strong></p>
                    <p className="text-[#9A9A9A]">Latest Topic: <strong className="text-[#FF8A00]">{student.diaries[0]?.title}</strong></p>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-xs font-bold text-[#FF8A00] group-hover:translate-x-1 transition-transform">
                    <span>View Daily Diaries Timeline</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              ))}

              {studentList.length === 0 && (
                <div className="col-span-2 p-8 text-center text-[#9A9A9A] text-xs">
                  No daily diary submissions found in database.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBMODULE 3: PENDING WORK DELIVERABLES & BROADCAST ASSIGNMENTS */}
        {activeSubmodule === 'pending-work' && (
          <div className="space-y-6">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#EDEDED] pb-3 gap-3">
              <div>
                <h2 className="text-base font-bold text-[#0D0D0D]">Pending Work Submissions & Assignments</h2>
                <p className="text-xs text-[#9A9A9A]">Broadcast task assignments to all students and evaluate submitted project deliverables.</p>
              </div>

              <button
                onClick={() => setShowBroadcastModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-extrabold rounded-xl shadow-md hover:opacity-95 flex items-center gap-1.5 transition-all"
              >
                <Megaphone className="h-4 w-4" />
                <span>+ Broadcast New Task Assignment</span>
              </button>
            </div>

            {/* Broadcast Task Assignments Banner List */}
            {taskAssignments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-[#0D0D0D] uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="h-3.5 w-3.5 text-[#FF8A00]" />
                  <span>Broadcasted Task Assignments for Students</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {taskAssignments.map((task, idx) => (
                    <div key={task.id ? `${task.id}-${idx}` : `task-${idx}`} className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-2 relative group hover:border-[#FF8A00] transition-all">
                      <div className="flex justify-between items-start pr-8">
                        <h4 className="text-xs font-bold text-[#0D0D0D]">{task.task_title}</h4>
                        <span className="text-[10px] font-bold text-[#FF8A00] bg-white border border-orange-200 px-2 py-0.5 rounded-md">
                          Due: {task.due_date}
                        </span>
                      </div>

                      {/* Delete Task Assignment Button */}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete this Task Assignment"
                        className="absolute top-3 right-3 p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <p className="text-xs text-[#4A4A4A] leading-relaxed">{task.message_instructions}</p>
                      
                      {task.common_drive_url && (
                        <a
                          href={task.common_drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF3D00] hover:underline pt-1"
                        >
                          <FolderPlus className="h-3.5 w-3.5" />
                          <span>Open Common Google Drive Folder</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submissions Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-[#0D0D0D] uppercase tracking-wider">
                  Submitted Student Deliverables
                </h3>
                <span className="text-xs font-bold text-[#FF3D00] bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                  {pendingWorkList.length} Deliverables Awaiting Review
                </span>
              </div>

              <div className="space-y-3">
                {pendingWorkList.map((work, idx) => (
                  <div key={work.id ? `${work.id}-${idx}` : `work-${idx}`} className="p-5 bg-[#F7F7F7] border border-[#EDEDED] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white transition-all shadow-xs">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#0D0D0D]">{work.internName}</h4>
                        <span className="text-xs text-[#9A9A9A]">({work.email})</span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          work.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : work.status === 'Revision Requested' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {work.status}
                        </span>
                        {work.grade && (
                          <span className="text-[10px] font-black px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded-md flex items-center gap-1">
                            <Star className="h-3 w-3 fill-purple-600 text-purple-600" /> Grade: {work.grade}
                          </span>
                        )}
                      </div>

                      <h5 className="text-xs font-extrabold text-[#FF8A00] flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{work.task_title}</span>
                      </h5>

                      <p className="text-xs text-[#4A4A4A] leading-relaxed">{work.submission_notes}</p>

                      {work.admin_feedback && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl">
                          <strong>Super Admin Review: </strong>{work.admin_feedback}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                      {work.deliverable_url && (
                        <a
                          href={work.deliverable_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white border border-[#EDEDED] hover:border-[#FF8A00] text-xs font-bold rounded-xl text-[#0D0D0D] flex items-center gap-1.5 shadow-xs"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-[#FF8A00]" />
                          <span>Inspect GitHub/Link</span>
                        </a>
                      )}

                      <button
                        onClick={() => handleOpenWorkReview(work)}
                        className="px-4 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 flex items-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{work.status === 'Approved' ? 'Edit Evaluation' : 'Evaluate & Grade'}</span>
                      </button>

                      {/* Delete Deliverable Submission Button */}
                      <button
                        onClick={() => handleDeleteSubmission(work.id)}
                        title="Delete Student Deliverable"
                        className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {pendingWorkList.length === 0 && (
                  <div className="p-8 text-center text-[#9A9A9A] text-xs">
                    No pending work submissions awaiting review.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STUDENT DIARY TIMELINE MODAL */}
      {selectedStudentDiaries && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-extrabold text-lg text-[#0D0D0D]">
                  Daily Diaries — {selectedStudentDiaries.internName}
                </h3>
                <p className="text-xs text-[#9A9A9A]">{selectedStudentDiaries.email} | {selectedStudentDiaries.problemStatement}</p>
              </div>
              <button 
                onClick={() => setSelectedStudentDiaries(null)}
                className="text-[#9A9A9A] hover:text-[#0D0D0D] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Submissions List */}
            <div className="space-y-4">
              {selectedStudentDiaries.diaries.map((diary, idx) => (
                <div key={diary.id ? `${diary.id}-${idx}` : `diary-idx-${idx}`} className="p-5 bg-[#FAFAFA] border border-[#EDEDED] rounded-2xl space-y-3 shadow-xs">
                  <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
                    <h4 className="text-sm font-extrabold text-[#0D0D0D] flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#FF8A00]" />
                      <span>{diary.title}</span>
                    </h4>
                    <span className="text-xs font-semibold text-[#9A9A9A] px-2.5 py-0.5 bg-white border border-[#EDEDED] rounded-md">
                      Date: {diary.diary_date || diary.date}
                    </span>
                  </div>

                  <div className="text-xs space-y-2 text-[#4A4A4A]">
                    <p><strong className="text-[#0D0D0D]">Submitted Summary / Work Done: </strong>{diary.diary_text || diary.tasks_completed || diary.summary || diary.title}</p>
                    {diary.challenges && <p><strong className="text-amber-700">Challenges / Blockers: </strong>{diary.challenges}</p>}
                    {diary.plan_tomorrow && <p><strong className="text-[#0D0D0D]">Plan for Tomorrow: </strong>{diary.plan_tomorrow}</p>}
                  </div>

                  {diary.admin_feedback && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl">
                      <strong>Admin Feedback: </strong>{diary.admin_feedback}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleOpenFeedbackForm(diary)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{diary.admin_feedback ? 'Edit Feedback' : 'Add Admin Feedback'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback Submission Modal Inside Drawer */}
            {selectedDiaryForFeedback && (
              <div className="mt-4 p-4 bg-white border border-[#FF8A00]/40 rounded-2xl shadow-md space-y-3">
                <h4 className="text-xs font-bold text-[#0D0D0D]">
                  Enter Feedback for "{selectedDiaryForFeedback.title}"
                </h4>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter guidance or review feedback..."
                  className="w-full p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />

                {feedbackSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Feedback submitted successfully!</span>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDiaryForFeedback(null)}
                    className="px-3 py-1.5 border border-[#EDEDED] text-xs font-bold rounded-xl text-[#0D0D0D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendFeedback}
                    disabled={submittingFeedback}
                    className="px-4 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{submittingFeedback ? 'Submitting...' : 'Submit Feedback'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PENDING WORK EVALUATION MODAL */}
      {selectedWorkForReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <div>
                <h3 className="font-extrabold text-base text-[#0D0D0D]">
                  Evaluate Deliverable — {selectedWorkForReview.internName}
                </h3>
                <p className="text-xs text-[#FF8A00] font-bold mt-0.5">{selectedWorkForReview.task_title}</p>
              </div>
              <button 
                onClick={() => setSelectedWorkForReview(null)}
                className="text-[#9A9A9A] hover:text-[#0D0D0D] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Assign Grade</label>
                <select
                  value={workGrade}
                  onChange={(e) => setWorkGrade(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                >
                  <option value="A+">A+ (Outstanding / Exceptional)</option>
                  <option value="A">A (Excellent Quality)</option>
                  <option value="B">B (Good / Meets Expectation)</option>
                  <option value="Needs Revision">Needs Revision</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Review Decision Status</label>
                <select
                  value={workStatus}
                  onChange={(e) => setWorkStatus(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                >
                  <option value="Approved">Approved</option>
                  <option value="Revision Requested">Revision Requested</option>
                  <option value="Pending Review">Keep Under Review</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Super Admin Feedback / Review Notes</label>
                <textarea
                  rows={3}
                  value={workFeedback}
                  onChange={(e) => setWorkFeedback(e.target.value)}
                  placeholder="Enter feedback notes or guidance for the intern..."
                  className="w-full p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              {workReviewSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Deliverable evaluation saved successfully!</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEDED]">
              <button
                type="button"
                onClick={() => setSelectedWorkForReview(null)}
                className="px-3.5 py-2 border border-[#EDEDED] text-xs font-bold rounded-xl text-[#0D0D0D]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWorkReview}
                disabled={submittingWorkReview}
                className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>{submittingWorkReview ? 'Saving Evaluation...' : 'Save Evaluation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST TASK ASSIGNMENT MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleBroadcastTask} className="bg-white border border-[#EDEDED] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 text-[#FF8A00] rounded-xl">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0D0D0D]">Broadcast Task Assignment</h3>
                  <p className="text-xs text-[#9A9A9A]">Send a new pending task assignment & Drive link to all students.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="text-[#9A9A9A] hover:text-[#0D0D0D] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Task Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. GitHub Seven-Step Activity Assignment"
                  className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Message / Instructions for Students</label>
                <textarea
                  rows={3}
                  value={newTaskInstructions}
                  onChange={(e) => setNewTaskInstructions(e.target.value)}
                  placeholder="e.g. Please complete your 7-step activity and submit your GitHub repository link and Drive folder URL below."
                  className="w-full p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Common Google Drive Folder URL</label>
                <input
                  type="url"
                  value={newTaskDriveUrl}
                  onChange={(e) => setNewTaskDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              {broadcastSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Task assignment broadcasted to all students successfully!</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEDED]">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-3.5 py-2 border border-[#EDEDED] text-xs font-bold rounded-xl text-[#0D0D0D]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingBroadcast}
                className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 flex items-center gap-1.5"
              >
                <Megaphone className="h-4 w-4" />
                <span>{submittingBroadcast ? 'Broadcasting...' : 'Broadcast Task to Students'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
