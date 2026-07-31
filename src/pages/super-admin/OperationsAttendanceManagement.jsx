import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ManagementFilterBar } from '../../components/common/ManagementFilterBar';
import { calculateGpsDistanceMeters, generateSessionCode, generateSessionPassword } from '../../utils/attendanceUtils';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Key, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Settings, 
  FileText, 
  Search, 
  ShieldCheck, 
  Users, 
  Lock, 
  Unlock, 
  Download, 
  Navigation,
  Edit,
  UserCheck
} from 'lucide-react';

export function OperationsAttendanceManagement() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'create', 'sessions', 'monitor', 'manual', 'reports', 'settings'
  const [sessionSubTab, setSessionSubTab] = useState('live'); // 'live', 'scheduled', 'closed', 'history'

  // Form & Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionNewStatus, setCorrectionNewStatus] = useState('manual_present');

  // Filter Bar State
  const initialFilters = {
    search: '',
    problemStatement: 'all',
    college: 'all',
    city: 'all',
    status: 'all',
  };
  const [filters, setFilters] = useState(initialFilters);

  const collegeOptions = ['GCOEJ Jalgaon', 'COEP Pune', 'VJTI Mumbai', 'PICT Pune'];
  const cityOptions = ['Jalgaon', 'Pune', 'Mumbai', 'Nagpur', 'Nashik'];
  const problemStatementOptions = ['AI Automated Workflow Engine', 'LLM Agent Swarm Orchestration', 'Real-time Vision AI Analytics'];

  // Global Attendance System Settings
  const [attendanceSettings, setAttendanceSettings] = useState({
    defaultDurationMinutes: 15,
    defaultRadiusMeters: 100,
    lateThresholdMinutes: 5,
    requireGps: true,
    requirePassword: true,
    allowReopen: true,
    maxExtensionMinutes: 60,
  });

  // Mock Active & Closed Attendance Sessions
  const [sessions, setSessions] = useState([
    {
      id: 'sess-101',
      code: 'ATT-9824',
      title: 'Morning Standup & Attendance',
      date: '2026-07-28',
      startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      durationMinutes: 15,
      latitude: 20.9980,
      longitude: 75.5667,
      radiusMeters: 100,
      password: generateSessionPassword(),
      status: 'live', // 'live', 'paused', 'closed', 'scheduled'
      cycleNumber: 1,
      problemStatement: 'AI Automated Workflow Engine',
      totalPresent: 24,
      totalLate: 2,
      totalAbsent: 4,
    },
    {
      id: 'sess-100',
      code: 'ATT-4412',
      title: 'Yesterday Lab Sync',
      date: '2026-07-27',
      startTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      endTime: new Date(Date.now() - 23.5 * 3600 * 1000).toISOString(),
      durationMinutes: 15,
      latitude: 20.9980,
      longitude: 75.5667,
      radiusMeters: 100,
      password: '******',
      status: 'closed',
      cycleNumber: 1,
      problemStatement: 'LLM Agent Swarm Orchestration',
      totalPresent: 28,
      totalLate: 1,
      totalAbsent: 1,
    }
  ]);

  // Mock Live Attendance Records Stream
  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      id: 'rec-1',
      sessionId: 'sess-101',
      sessionCode: 'ATT-9824',
      internId: 'int-101',
      internName: 'Aarav Sharma',
      college: 'GCOEJ Jalgaon',
      city: 'Jalgaon',
      problemStatement: 'AI Automated Workflow Engine',
      markedAt: new Date(Date.now() - 3 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latitude: 20.9981,
      longitude: 75.5668,
      distanceMeters: 14.2,
      gpsAccuracy: 3.5,
      status: 'present', // 'present', 'late', 'absent', 'leave', 'not_marked', 'manual_present'
      cycleNumber: 1,
      isManual: false,
    },
    {
      id: 'rec-2',
      sessionId: 'sess-101',
      sessionCode: 'ATT-9824',
      internId: 'int-102',
      internName: 'Ananya Verma',
      college: 'COEP Pune',
      city: 'Pune',
      problemStatement: 'LLM Agent Swarm Orchestration',
      markedAt: new Date(Date.now() - 1 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latitude: 20.9984,
      longitude: 75.5670,
      distanceMeters: 55.8,
      gpsAccuracy: 4.8,
      status: 'late',
      cycleNumber: 1,
      isManual: false,
    },
  ]);

  // Load Real Supabase Attendance Sessions & Records
  useEffect(() => {
    async function fetchAttendanceData() {
      try {
        const { data: dbSessions, error: sessErr } = await supabase
          .from('attendance_sessions')
          .select(`
            *,
            problem_statements (title)
          `)
          .order('created_at', { ascending: false });

        if (!sessErr && dbSessions && dbSessions.length > 0) {
          const formattedSessions = dbSessions.map(s => ({
            id: s.id,
            code: s.session_code || `ATT-${s.id.substring(0, 4)}`,
            title: s.title,
            date: s.attendance_date,
            startTime: s.start_time,
            endTime: s.end_time,
            durationMinutes: s.default_duration_minutes || 15,
            latitude: Number(s.latitude) || 20.9980,
            longitude: Number(s.longitude) || 75.5667,
            radiusMeters: s.radius_meters || 100,
            password: s.attendance_password_hash || '******',
            status: s.status || (s.is_active ? 'live' : 'closed'),
            cycleNumber: s.cycle_number || 1,
            problemStatement: s.problem_statements?.title || 'General',
            totalPresent: 0,
            totalLate: 0,
            totalAbsent: 0,
          }));
          setSessions(formattedSessions);
        }

        const { data: dbRecords, error: recErr } = await supabase
          .from('attendance_records')
          .select(`
            *,
            profiles (full_name, college_name, city, problem_statements(title)),
            attendance_sessions (session_code)
          `)
          .order('marked_at', { ascending: false });

        if (!recErr && dbRecords && dbRecords.length > 0) {
          const formattedRecords = dbRecords.map(r => ({
            id: r.id,
            sessionId: r.session_id,
            sessionCode: r.attendance_sessions?.session_code || 'ATT-LIVE',
            internId: r.intern_id,
            internName: r.profiles?.full_name || 'Intern',
            college: r.profiles?.college_name || 'N/A',
            city: r.profiles?.city || 'N/A',
            problemStatement: r.profiles?.problem_statements?.title || 'General',
            markedAt: new Date(r.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            distanceMeters: Number(r.distance_meters) || 12.5,
            gpsAccuracy: Number(r.gps_accuracy) || 4.0,
            status: r.status,
            cycleNumber: r.cycle_number || 1,
            isManual: r.is_manual,
          }));
          setAttendanceRecords(formattedRecords);
        }
      } catch (err) {
        console.error('Error fetching Supabase attendance data:', err);
      }
    }

    fetchAttendanceData();
  }, []);

  // Handle Session Time Extension (+5, +10, +15, +30 min)
  const handleExtendSessionTime = (sessionId, extraMinutes) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const currentEnd = new Date(s.endTime).getTime();
        const newEnd = new Date(currentEnd + extraMinutes * 60 * 1000).toISOString();
        return {
          ...s,
          endTime: newEnd,
          durationMinutes: s.durationMinutes + extraMinutes,
        };
      }
      return s;
    }));
  };

  // Pause / Resume Session
  const handleTogglePauseSession = (sessionId) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          status: s.status === 'live' ? 'paused' : 'live'
        };
      }
      return s;
    }));
  };

  // Close Session
  const handleCloseSession = (sessionId) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          status: 'closed'
        };
      }
      return s;
    }));
  };

  // Reopen Session (Creates new cycle & generates new password)
  const handleReopenSession = (session) => {
    const newPassword = generateSessionPassword();
    const newCycle = (session.cycleNumber || 1) + 1;
    const now = new Date();
    const newEnd = new Date(now.getTime() + attendanceSettings.defaultDurationMinutes * 60 * 1000).toISOString();

    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          status: 'live',
          cycleNumber: newCycle,
          password: newPassword,
          startTime: now.toISOString(),
          endTime: newEnd,
        };
      }
      return s;
    }));
  };

  // Create New Session Submit
  const handleCreateSessionSubmit = (e) => {
    e.preventDefault();
    const code = generateSessionCode();
    const password = generateSessionPassword();
    const now = new Date();
    const end = new Date(now.getTime() + newSessionForm.durationMinutes * 60 * 1000);

    const newSess = {
      id: `sess-${Date.now()}`,
      code,
      title: newSessionForm.title || 'Live Attendance Session',
      date: now.toISOString().split('T')[0],
      startTime: now.toISOString(),
      endTime: end.toISOString(),
      durationMinutes: parseInt(newSessionForm.durationMinutes),
      latitude: parseFloat(newSessionForm.latitude),
      longitude: parseFloat(newSessionForm.longitude),
      radiusMeters: parseInt(newSessionForm.radiusMeters),
      password,
      status: 'live',
      cycleNumber: 1,
      problemStatement: newSessionForm.problemStatement,
      totalPresent: 0,
      totalLate: 0,
      totalAbsent: 0,
    };

    setSessions([newSess, ...sessions]);
    setShowCreateModal(false);
    setActiveTab('sessions');
    setSessionSubTab('live');
  };

  // Apply Manual Attendance Correction
  const handleSaveCorrection = () => {
    if (!selectedRecordForCorrection || !correctionReason.trim()) return;

    setAttendanceRecords(prev => prev.map(r => {
      if (r.id === selectedRecordForCorrection.id) {
        return {
          ...r,
          status: correctionNewStatus,
          isManual: true,
          correctionReason,
        };
      }
      return r;
    }));

    setShowCorrectionModal(false);
    setSelectedRecordForCorrection(null);
    setCorrectionReason('');
  };

  // Filtered Roster & Monitor Lists
  const filteredMonitorRecords = attendanceRecords.filter(r => {
    const searchMatch = !filters.search || r.internName.toLowerCase().includes(filters.search.toLowerCase()) || r.college.toLowerCase().includes(filters.search.toLowerCase());
    const collegeMatch = filters.college === 'all' || r.college.includes(filters.college);
    const cityMatch = filters.city === 'all' || r.city.includes(filters.city);
    const psMatch = filters.problemStatement === 'all' || r.problemStatement.includes(filters.problemStatement);
    return searchMatch && collegeMatch && cityMatch && psMatch;
  });

  const activeLiveSession = sessions.find(s => s.status === 'live' || s.status === 'paused');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>Super Admin Operations & GPS Geo-Fencing</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Attendance Management</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Create live sessions, manage GPS geo-fencing, monitor real-time check-ins, and override attendance records.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 flex items-center gap-2 hover:opacity-95 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Attendance Session</span>
        </button>
      </div>

      {/* Main Submodule Navigation Tabs */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-2 shadow-sm flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: ShieldCheck },
          { id: 'create', label: 'Create Session', icon: Plus },
          { id: 'sessions', label: 'Attendance Sessions', icon: Calendar, badge: sessions.filter(s=>s.status==='live').length },
          { id: 'monitor', label: 'Live Attendance Monitor', icon: Navigation, badge: attendanceRecords.length },
          { id: 'manual', label: 'Manual Correction', icon: Edit },
          { id: 'reports', label: 'Reports & Export', icon: FileText },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white shadow-sm'
                : 'text-[#0D0D0D] hover:bg-[#F7F7F7] hover:text-[#FF8A00]'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#EDEDED] text-[#0D0D0D]'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Common Reusable Filter Bar (Used across Monitor, Sessions & Reports) */}
      <ManagementFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        collegeOptions={collegeOptions}
        cityOptions={cityOptions}
        problemStatementOptions={problemStatementOptions}
        placeholderSearch="Search by Intern Name, ID, College, City..."
      />

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Active Live Sessions</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold text-[#0D0D0D]">{sessions.filter(s=>s.status==='live').length}</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs">Live Active</span>
              </div>
            </div>

            <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Today Check-ins</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold text-[#0D0D0D]">{attendanceRecords.length}</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs">GPS Verified</span>
              </div>
            </div>

            <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">GPS Radius Default</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold text-[#0D0D0D]">{attendanceSettings.defaultRadiusMeters}m</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs">Geo-Fence</span>
              </div>
            </div>

            <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Default Duration</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold text-[#0D0D0D]">{attendanceSettings.defaultDurationMinutes} mins</span>
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl font-bold text-xs">Timer</span>
              </div>
            </div>
          </div>

          {/* Active Live Session Highlight Card */}
          {activeLiveSession ? (
            <div className="bg-white border-2 border-[#FF8A00] rounded-2xl p-6 shadow-md space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-[#FF8A00] to-[#FF3D00] text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase">
                {activeLiveSession.status === 'live' ? '🔴 LIVE SESSION IN PROGRESS' : '⏸️ SESSION PAUSED'}
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#EDEDED] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0D0D0D] flex items-center gap-2">
                    <span>{activeLiveSession.title}</span>
                    <span className="text-xs font-extrabold px-2 py-0.5 bg-[#F7F7F7] border border-[#EDEDED] text-[#FF3D00] rounded">
                      Code: {activeLiveSession.code}
                    </span>
                  </h3>
                  <p className="text-xs text-[#9A9A9A] mt-0.5">
                    Cycle #{activeLiveSession.cycleNumber} | Geo-Radius: {activeLiveSession.radiusMeters}m | Password: <strong className="text-[#0D0D0D] bg-[#F7F7F7] px-2 py-0.5 rounded font-mono">{activeLiveSession.password}</strong>
                  </p>
                </div>

                {/* Quick Action Extension & Pause Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleTogglePauseSession(activeLiveSession.id)}
                    className="px-3 py-1.5 bg-[#F7F7F7] hover:bg-[#EDEDED] text-[#0D0D0D] font-bold text-xs rounded-xl flex items-center gap-1 border border-[#EDEDED]"
                  >
                    {activeLiveSession.status === 'live' ? <Pause className="h-3.5 w-3.5 text-amber-600" /> : <Play className="h-3.5 w-3.5 text-emerald-600" />}
                    <span>{activeLiveSession.status === 'live' ? 'Pause' : 'Resume'}</span>
                  </button>

                  <button
                    onClick={() => handleCloseSession(activeLiveSession.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200"
                  >
                    Close Session
                  </button>
                </div>
              </div>

              {/* Time Extension Shortcuts */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                <span className="font-semibold text-[#9A9A9A]">Quick Extend Session Time:</span>
                <div className="flex items-center gap-2">
                  {[5, 10, 15, 30].map(mins => (
                    <button
                      key={mins}
                      onClick={() => handleExtendSessionTime(activeLiveSession.id, mins)}
                      className="px-2.5 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/30 text-[#FF3D00] font-extrabold text-xs rounded-lg hover:bg-[#FF8A00] hover:text-white transition-all"
                    >
                      +{mins} Mins
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-8 shadow-sm text-center space-y-3">
              <Calendar className="h-10 w-10 text-[#9A9A9A] mx-auto" />
              <h3 className="text-base font-bold text-[#0D0D0D]">No Active Live Session</h3>
              <p className="text-xs text-[#9A9A9A] max-w-sm mx-auto">Create a new live attendance session with GPS geo-fencing and automated 6-digit password protection.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create Live Session
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE ATTENDANCE SESSION */}
      {(activeTab === 'create' || showCreateModal) && (
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-5 max-w-2xl mx-auto">
          <div className="border-b border-[#EDEDED] pb-3">
            <h2 className="text-lg font-bold text-[#0D0D0D] flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#FF3D00]" />
              <span>Create New Live Attendance Session</span>
            </h2>
            <p className="text-xs text-[#9A9A9A]">Generates a secure 4-digit Attendance ID and 6-digit random password automatically.</p>
          </div>

          <form onSubmit={handleCreateSessionSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#0D0D0D] block mb-1">Session Title / Topic *</label>
              <input
                type="text"
                required
                value={newSessionForm.title}
                onChange={e => setNewSessionForm({...newSessionForm, title: e.target.value})}
                placeholder="e.g. Daily Morning Standup & Attendance"
                className="w-full px-3 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs focus:outline-none focus:border-[#FF8A00]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Duration (Minutes) *</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={newSessionForm.durationMinutes}
                  onChange={e => setNewSessionForm({...newSessionForm, durationMinutes: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Allowed GPS Radius (Meters) *</label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={newSessionForm.radiusMeters}
                  onChange={e => setNewSessionForm({...newSessionForm, radiusMeters: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs focus:outline-none focus:border-[#FF8A00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Center Latitude *</label>
                <input
                  type="number"
                  step="any"
                  value={newSessionForm.latitude}
                  onChange={e => setNewSessionForm({...newSessionForm, latitude: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Center Longitude *</label>
                <input
                  type="number"
                  step="any"
                  value={newSessionForm.longitude}
                  onChange={e => setNewSessionForm({...newSessionForm, longitude: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs focus:outline-none focus:border-[#FF8A00]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {showCreateModal && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl font-bold text-xs text-[#0D0D0D]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md"
              >
                Launch Session Live 🚀
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ATTENDANCE SESSIONS LIST (Sub-tabs: Live, Scheduled, Closed, History) */}
      {activeTab === 'sessions' && (
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EDEDED] pb-3">
            {['live', 'scheduled', 'closed', 'history'].map(sub => (
              <button
                key={sub}
                onClick={() => setSessionSubTab(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  sessionSubTab === sub ? 'bg-[#FF3D00]/10 text-[#FF3D00] border border-[#FF3D00]/20' : 'text-[#9A9A9A] hover:text-[#0D0D0D]'
                }`}
              >
                {sub} Sessions ({sessions.filter(s => sub === 'live' ? (s.status === 'live' || s.status === 'paused') : s.status === sub).length})
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {sessions.filter(s => sessionSubTab === 'live' ? (s.status === 'live' || s.status === 'paused') : s.status === sessionSubTab).map(sess => (
              <div key={sess.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#0D0D0D]">{sess.title}</h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-white border border-[#EDEDED] text-[#FF3D00] rounded">
                      ID: {sess.code}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                      Cycle #{sess.cycleNumber}
                    </span>
                  </div>

                  <p className="text-xs text-[#9A9A9A]">
                    Password: <strong className="text-[#0D0D0D] font-mono">{sess.password}</strong> | Radius: <strong>{sess.radiusMeters}m</strong> | Duration: {sess.durationMinutes} mins
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {sess.status === 'closed' ? (
                    <button
                      onClick={() => handleReopenSession(sess)}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reopen Session (Cycle #{sess.cycleNumber + 1})
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleTogglePauseSession(sess.id)}
                        className="px-3 py-1 bg-white border border-[#EDEDED] text-xs font-bold rounded-lg text-[#0D0D0D]"
                      >
                        {sess.status === 'live' ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => handleCloseSession(sess.id)}
                        className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LIVE ATTENDANCE MONITOR */}
      {activeTab === 'monitor' && (
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#0D0D0D] flex items-center gap-2">
                <Navigation className="h-4 w-4 text-[#FF3D00]" />
                <span>Live Attendance Check-in Stream</span>
              </h2>
              <p className="text-xs text-[#9A9A9A]">Real-time intern check-in log with GPS distance & precision metrics.</p>
            </div>
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              Live Feed Connected
            </span>
          </div>

          <div className="space-y-3">
            {filteredMonitorRecords.map(rec => (
              <div key={rec.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#0D0D0D]">{rec.internName}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-[#EDEDED] text-[#0D0D0D] rounded">
                      {rec.college} ({rec.city})
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                      rec.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {rec.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#9A9A9A]">
                    Check-in Time: <strong className="text-[#0D0D0D]">{rec.markedAt}</strong> | Project: {rec.problemStatement}
                  </p>
                </div>

                <div className="text-right text-xs shrink-0">
                  <span className="font-bold text-[#FF3D00] block">Distance: {rec.distanceMeters}m</span>
                  <span className="text-[10px] text-[#9A9A9A]">GPS Accuracy: ±{rec.gpsAccuracy}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MANUAL ATTENDANCE CORRECTION */}
      {activeTab === 'manual' && (
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-[#EDEDED] pb-3">
            <h2 className="text-base font-bold text-[#0D0D0D] flex items-center gap-2">
              <Edit className="h-4 w-4 text-[#FF8A00]" />
              <span>Manual Attendance Override & Correction</span>
            </h2>
            <p className="text-xs text-[#9A9A9A]">Override intern status manually with mandatory audit reason logging.</p>
          </div>

          <div className="space-y-3">
            {filteredMonitorRecords.map(rec => (
              <div key={rec.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-[#0D0D0D]">{rec.internName} ({rec.college})</h4>
                  <p className="text-xs text-[#9A9A9A]">Current Status: <strong className="text-[#0D0D0D] uppercase">{rec.status}</strong> {rec.isManual && '(Manually Corrected)'}</p>
                </div>

                <button
                  onClick={() => {
                    setSelectedRecordForCorrection(rec);
                    setShowCorrectionModal(true);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Override Status
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: REPORTS & EXPORT */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4 text-center">
          <FileText className="h-10 w-10 text-[#FF8A00] mx-auto" />
          <h3 className="text-base font-bold text-[#0D0D0D]">Attendance Reports & Export Console</h3>
          <p className="text-xs text-[#9A9A9A] max-w-sm mx-auto">Export comprehensive intern GPS attendance logs, check-in times, distances, and manual override audit history.</p>

          <button className="px-5 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2">
            <Download className="h-4 w-4" /> Download Complete Attendance Report (CSV)
          </button>
        </div>
      )}

      {/* TAB 7: ATTENDANCE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-5 max-w-xl mx-auto text-xs">
          <div className="border-b border-[#EDEDED] pb-3">
            <h2 className="text-base font-bold text-[#0D0D0D]">Global Attendance System Configuration</h2>
            <p className="text-xs text-[#9A9A9A]">Configure default geo-fence radius, duration, and security thresholds.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-bold text-[#0D0D0D] block mb-1">Default Duration (Minutes):</label>
              <input
                type="number"
                value={attendanceSettings.defaultDurationMinutes}
                onChange={e => setAttendanceSettings({...attendanceSettings, defaultDurationMinutes: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-[#0D0D0D] block mb-1">Default Geo-fence Radius (Meters):</label>
              <input
                type="number"
                value={attendanceSettings.defaultRadiusMeters}
                onChange={e => setAttendanceSettings({...attendanceSettings, defaultRadiusMeters: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-[#0D0D0D] block mb-1">Late Threshold (Minutes):</label>
              <input
                type="number"
                value={attendanceSettings.lateThresholdMinutes}
                onChange={e => setAttendanceSettings({...attendanceSettings, lateThresholdMinutes: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#EDEDED]">
              <span className="font-bold text-[#0D0D0D]">Require GPS Geo-location Access:</span>
              <input
                type="checkbox"
                checked={attendanceSettings.requireGps}
                onChange={e => setAttendanceSettings({...attendanceSettings, requireGps: e.target.checked})}
                className="h-4 w-4 text-[#FF3D00] rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Manual Correction Modal */}
      {showCorrectionModal && selectedRecordForCorrection && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <h3 className="text-base font-bold text-[#0D0D0D]">Override Attendance Status</h3>
              <button onClick={() => setShowCorrectionModal(false)} className="text-[#9A9A9A]">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p>Intern: <strong className="text-[#0D0D0D]">{selectedRecordForCorrection.internName}</strong></p>

              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">New Status *</label>
                <select
                  value={correctionNewStatus}
                  onChange={e => setCorrectionNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl font-bold"
                >
                  <option value="manual_present">Manual Present</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Mandatory Override Reason *</label>
                <textarea
                  required
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                  placeholder="State technical reason or approved request..."
                  className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCorrectionModal(false)} className="px-4 py-2 bg-[#EDEDED] text-[#0D0D0D] font-semibold text-xs rounded-xl">Cancel</button>
              <button onClick={handleSaveCorrection} className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-sm">Save Override</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
