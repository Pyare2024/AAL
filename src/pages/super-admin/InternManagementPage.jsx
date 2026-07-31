import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchAllInterns,
  fetchActiveProblemStatements,
  fetchInternById,
  updateInternProfile,
  updateInternStatus,
  assignProblemStatement,
  subscribeToInternManagementChanges
} from '../../services/internManagementService';
import { ManagementFilterBar } from '../../components/common/ManagementFilterBar';
import { 
  Users, 
  Target, 
  Activity, 
  TrendingUp, 
  FileText, 
  AlertCircle, 
  User,
  Loader2,
  RefreshCw,
  Edit3,
  CheckCircle2,
  XCircle,
  Download,
  Check,
  X
} from 'lucide-react';

export function InternManagementPage() {
  const [activeSubmodule, setActiveSubmodule] = useState('all-active');
  const [interns, setInterns] = useState([]);
  const [problemStatements, setProblemStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected Intern Modal & Edit Drawer State
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Allocation Modal State
  const [allocationModalIntern, setAllocationModalIntern] = useState(null);
  const [selectedPsId, setSelectedPsId] = useState('');
  const [allocationNote, setAllocationNote] = useState('');

  // Status Change Confirmation Modal State
  const [statusConfirmIntern, setStatusConfirmIntern] = useState(null);
  const [targetNewStatus, setTargetNewStatus] = useState('');

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

  // Data Loader
  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const [allInternsData, psData] = await Promise.all([
        fetchAllInterns(),
        fetchActiveProblemStatements()
      ]);

      setInterns(allInternsData);
      setProblemStatements(psData);

      // Keep selected intern synced
      setSelectedIntern((prev) => {
        if (!prev) return null;
        const fresh = allInternsData.find((i) => i.id === prev.id);
        return fresh || null;
      });
    } catch (err) {
      console.error('Error fetching dynamic intern management data:', err);
      setError(err.message || 'Failed to fetch intern data.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Lifecycle & Realtime Subscriptions
  useEffect(() => {
    loadData(true);

    const unsubscribe = subscribeToInternManagementChanges((payload) => {
      if (import.meta.env.DEV) console.log('Realtime payload received:', payload);
      loadData(false);
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Derived Options for FilterBar
  const collegeOptions = Array.from(new Set(interns.map((i) => i.college).filter((c) => c && c !== 'N/A')));
  const cityOptions = Array.from(new Set(interns.map((i) => i.city).filter((c) => c && c !== 'N/A')));
  const statusOptions = ['Active', 'Inactive', 'On Leave', 'Suspended'];

  // Filter Logic
  const filteredInterns = interns.filter((intern) => {
    const searchMatch =
      !filters.search ||
      intern.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      intern.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      intern.mobile.includes(filters.search) ||
      intern.id.toLowerCase().includes(filters.search.toLowerCase());

    const psMatch =
      filters.problemStatement === 'all' ||
      intern.problemStatementId === filters.problemStatement;

    const collegeMatch =
      filters.college === 'all' || intern.college === filters.college;

    const cityMatch =
      filters.city === 'all' || intern.city === filters.city;

    const statusMatch =
      filters.status === 'all' || intern.status.toLowerCase() === filters.status.toLowerCase();

    return searchMatch && psMatch && collegeMatch && cityMatch && statusMatch;
  });

  // Dynamic Submodules & Counts
  const submodules = [
    { id: 'all-active', label: 'All Active Interns', icon: Users, count: interns.filter(i => i.status === 'Active' || i.status === 'On Leave').length },
    { id: 'details', label: 'Intern Details', icon: User, count: interns.length },
    { id: 'allocation', label: 'Intern Allocation', icon: Target, count: interns.length },
    { id: 'status', label: 'Intern Status', icon: Activity, count: interns.length },
    { id: 'performance', label: 'Intern Performance', icon: TrendingUp, count: interns.length },
    { id: 'reports', label: 'Intern Reports', icon: FileText, count: interns.length },
  ];

  // Open Full Details Drawer with fresh fetch
  const handleOpenDetails = async (intern) => {
    setSelectedIntern(intern);
    setIsEditingProfile(false);
    try {
      const freshData = await fetchInternById(intern.id);
      setEditFormData({
        full_name: freshData.full_name || '',
        mobile: freshData.mobile || '',
        college_name: freshData.college_name || '',
        city: freshData.city || '',
        degree_name: freshData.degree_name || '',
        degree_year: freshData.degree_year || '',
        gender: freshData.gender || '',
        date_of_birth: freshData.date_of_birth || '',
        linkedin_url: freshData.linkedin_url || '',
        github_url: freshData.github_url || '',
      });
    } catch (e) {
      console.error('Error fetching detail profile:', e);
    }
  };

  // Save Profile Edit
  const handleSaveProfileEdit = async (e) => {
    e.preventDefault();
    if (!selectedIntern) return;
    setActionLoading(true);
    try {
      await updateInternProfile(selectedIntern.id, editFormData);
      await loadData(false);
      setIsEditingProfile(false);
    } catch (err) {
      alert(`Failed to save profile: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Status Change Handler
  const handleConfirmStatusChange = async () => {
    if (!statusConfirmIntern || !targetNewStatus) return;
    setActionLoading(true);
    try {
      await updateInternStatus(statusConfirmIntern.id, targetNewStatus.toLowerCase());
      await loadData(false);
      setStatusConfirmIntern(null);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Problem Statement Allocation Handler
  const handleExecuteAllocation = async (e) => {
    e.preventDefault();
    if (!allocationModalIntern) return;
    setActionLoading(true);
    try {
      await assignProblemStatement(allocationModalIntern.id, selectedPsId || null, null, allocationNote);
      await loadData(false);
      setAllocationModalIntern(null);
    } catch (err) {
      alert(`Failed to allocate project: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // CSV Report Generator
  const handleExportCSV = () => {
    if (filteredInterns.length === 0) {
      alert('No intern data available to export.');
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Mobile', 'College', 'City', 'Degree', 'Status', 'Onboarding Status', 'Problem Statement'];
    const rows = filteredInterns.map((i) => [
      i.id,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.email}"`,
      `"${i.mobile}"`,
      `"${i.college.replace(/"/g, '""')}"`,
      `"${i.city.replace(/"/g, '""')}"`,
      `"${i.degree.replace(/"/g, '""')}"`,
      `"${i.status}"`,
      `"${i.onboardingStatus}"`,
      `"${i.problemStatement.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `intern_management_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <Users className="h-3.5 w-3.5" />
            <span>Activated Interns Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Intern Management</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Monitor, allocate, manage performance, and handle reports for all active interns.
          </p>
        </div>
      </div>

      {/* Common Reusable Filter Bar */}
      <ManagementFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        problemStatementOptions={problemStatements}
        collegeOptions={collegeOptions}
        cityOptions={cityOptions}
        statusOptions={statusOptions}
        placeholderSearch="Search by Intern Name, Email, Mobile, ID..."
      />

      {/* Submodule Overview Grid Cards */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider">Intern Management Submodules</h2>
          <span className="text-xs text-[#9A9A9A]">Click a submodule card to switch management views</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  {sub.count} Interns
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#0D0D0D] group-hover:text-[#FF8A00] transition-colors">{sub.label}</h3>
                <p className="text-[11px] text-[#9A9A9A] mt-0.5">Inspect & update intern workspace</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Submodule View Content */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#FF8A00] animate-spin" />
            <p className="text-xs font-semibold text-[#9A9A9A]">Loading Real-time Intern Roster...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-700 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="inline-flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        ) : null}

        {/* SUBMODULE 1: ALL ACTIVE INTERNS */}
        {!loading && !error && activeSubmodule === 'all-active' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <h2 className="text-base font-bold text-[#0D0D0D]">All Active Interns ({filteredInterns.filter(i => i.status === 'Active' || i.status === 'On Leave').length})</h2>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active & On Leave Status</span>
            </div>

            <div className="space-y-3">
              {filteredInterns.filter(i => i.status === 'Active' || i.status === 'On Leave').length === 0 ? (
                <p className="text-xs text-[#9A9A9A] py-6 text-center">No active interns found matching the selected filters.</p>
              ) : (
                filteredInterns.filter(i => i.status === 'Active' || i.status === 'On Leave').map((intern) => (
                  <div key={intern.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white hover:border-[#D4D4D4] transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#0D0D0D]">{intern.name}</h3>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                          intern.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {intern.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#9A9A9A]">{intern.email} | {intern.college} ({intern.city})</p>
                      <p className="text-xs text-[#0D0D0D]">
                        Problem Statement: <strong className="text-[#FF8A00]">{intern.problemStatement}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => handleOpenDetails(intern)}
                        className="px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-xl text-xs font-bold text-[#0D0D0D] hover:border-[#FF8A00]"
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUBMODULE 2: INTERN DETAILS */}
        {!loading && !error && activeSubmodule === 'details' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Intern Comprehensive Profiles ({filteredInterns.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInterns.map((intern) => (
                <div key={intern.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-[#0D0D0D]">{intern.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EDEDED] rounded text-[#0D0D0D]">{intern.onboardingStatus}</span>
                    </div>
                    <p className="text-xs text-[#9A9A9A]">Email: {intern.email} | Mobile: {intern.mobile}</p>
                    <p className="text-xs text-[#0D0D0D] mt-1">College: {intern.college} | Branch: {intern.degree}</p>
                    <p className="text-xs text-[#FF8A00] font-medium">Project: {intern.problemStatement}</p>
                  </div>
                  <div className="pt-2 border-t border-[#EDEDED] flex justify-between items-center text-xs">
                    <span>Learning: <strong className="text-blue-600">{intern.learningProgress}</strong></span>
                    <button 
                      onClick={() => handleOpenDetails(intern)}
                      className="px-2.5 py-1 bg-white border border-[#D4D4D4] rounded-lg text-xs font-bold text-[#0D0D0D] hover:border-[#FF8A00]"
                    >
                      View / Edit Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMODULE 3: INTERN ALLOCATION */}
        {!loading && !error && activeSubmodule === 'allocation' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Problem Statement Allocation Management</h2>
            <div className="space-y-3">
              {filteredInterns.map((intern) => (
                <div key={intern.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-[#0D0D0D]">{intern.name}</h4>
                    <p className="text-xs text-[#9A9A9A]">Allocated Project: <strong className="text-[#FF8A00]">{intern.problemStatement}</strong></p>
                  </div>
                  <button 
                    onClick={() => {
                      setAllocationModalIntern(intern);
                      setSelectedPsId(intern.problemStatementId || '');
                      setAllocationNote('');
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl"
                  >
                    Change Allocation
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMODULE 4: INTERN STATUS */}
        {!loading && !error && activeSubmodule === 'status' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Account Status Control (Active / Suspended / Inactive / On Leave)</h2>
            <div className="space-y-3">
              {filteredInterns.map((intern) => (
                <div key={intern.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-[#0D0D0D]">{intern.name}</h4>
                    <p className="text-xs text-[#9A9A9A]">Status: <strong className="text-[#0D0D0D]">{intern.status}</strong> ({intern.accountStatus})</p>
                  </div>
                  <div className="flex gap-2">
                    {intern.accountStatus !== 'active' && (
                      <button 
                        onClick={() => { setStatusConfirmIntern(intern); setTargetNewStatus('active'); }}
                        className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold rounded-lg"
                      >
                        Activate
                      </button>
                    )}
                    {intern.accountStatus !== 'suspended' && (
                      <button 
                        onClick={() => { setStatusConfirmIntern(intern); setTargetNewStatus('suspended'); }}
                        className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg"
                      >
                        Suspend
                      </button>
                    )}
                    {intern.accountStatus !== 'on_leave' && (
                      <button 
                        onClick={() => { setStatusConfirmIntern(intern); setTargetNewStatus('on_leave'); }}
                        className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold rounded-lg"
                      >
                        Mark On Leave
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMODULE 5: INTERN PERFORMANCE */}
        {!loading && !error && activeSubmodule === 'performance' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Internship Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredInterns.map((intern) => (
                <div key={intern.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-[#0D0D0D]">{intern.name}</h4>
                  <div className="text-xs space-y-1 text-[#9A9A9A]">
                    <p>Attendance Rate: <strong className="text-emerald-600">{intern.attendanceRate}</strong></p>
                    <p>Learning Progress: <strong className="text-blue-600">{intern.learningProgress}</strong></p>
                    <p>Leaderboard: <strong className="text-[#FF3D00]">{intern.leaderboardRank} ({intern.points} pts)</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMODULE 6: INTERN REPORTS */}
        {!loading && !error && activeSubmodule === 'reports' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Generate & Export Intern Activity Reports</h2>
            <div className="p-6 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-center space-y-3">
              <FileText className="h-8 w-8 text-[#FF8A00] mx-auto" />
              <h3 className="text-sm font-bold text-[#0D0D0D]">Export Active Intern Analytics Report ({filteredInterns.length} Records)</h3>
              <p className="text-xs text-[#9A9A9A]">Download comprehensive performance, attendance, and onboarding progress CSV logs based on selected filters.</p>
              <button 
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-md"
              >
                <Download className="h-4 w-4" />
                <span>Download Filtered Report (CSV)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Intern Detail & Profile Edit Drawer */}
      {selectedIntern && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-2xl max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <h3 className="text-base font-bold text-[#0D0D0D]">
                {isEditingProfile ? 'Edit Intern Profile' : 'Active Intern Full Details'}
              </h3>
              <button onClick={() => setSelectedIntern(null)} className="text-[#9A9A9A] hover:text-[#0D0D0D]">✕</button>
            </div>

            {!isEditingProfile ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-[#F7F7F7] p-3 rounded-xl">
                  <p>Full Name: <strong className="text-[#0D0D0D]">{selectedIntern.fullName}</strong></p>
                  <p>Email: <strong className="text-[#0D0D0D]">{selectedIntern.email}</strong></p>
                  <p>Mobile: <strong className="text-[#0D0D0D]">{selectedIntern.mobile}</strong></p>
                  <p>College: <strong className="text-[#0D0D0D]">{selectedIntern.college}</strong></p>
                  <p>City: <strong className="text-[#0D0D0D]">{selectedIntern.city}</strong></p>
                  <p>Degree: <strong className="text-[#0D0D0D]">{selectedIntern.degree}</strong></p>
                </div>
                <div className="p-3 border border-[#EDEDED] rounded-xl space-y-1">
                  <p>Allocated Project: <strong className="text-[#FF8A00]">{selectedIntern.problemStatement}</strong></p>
                  <p>Account Status: <strong className="text-[#0D0D0D]">{selectedIntern.accountStatus}</strong></p>
                  <p>Onboarding Status: <strong className="text-[#0D0D0D]">{selectedIntern.onboardingStatus}</strong></p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Permitted Fields</span>
                  </button>
                  <button onClick={() => setSelectedIntern(null)} className="px-4 py-2 bg-[#EDEDED] text-[#0D0D0D] font-semibold text-xs rounded-xl">Close</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfileEdit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0D0D0D] mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={editFormData.full_name || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })} 
                      className="w-full p-2 border border-[#EDEDED] rounded-lg text-xs" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#0D0D0D] mb-1">Mobile</label>
                    <input 
                      type="text" 
                      value={editFormData.mobile || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })} 
                      className="w-full p-2 border border-[#EDEDED] rounded-lg text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#0D0D0D] mb-1">College Name</label>
                    <input 
                      type="text" 
                      value={editFormData.college_name || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, college_name: e.target.value })} 
                      className="w-full p-2 border border-[#EDEDED] rounded-lg text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#0D0D0D] mb-1">City</label>
                    <input 
                      type="text" 
                      value={editFormData.city || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })} 
                      className="w-full p-2 border border-[#EDEDED] rounded-lg text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#0D0D0D] mb-1">Degree Name</label>
                    <input 
                      type="text" 
                      value={editFormData.degree_name || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, degree_name: e.target.value })} 
                      className="w-full p-2 border border-[#EDEDED] rounded-lg text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#0D0D0D] mb-1">Degree Year</label>
                    <input 
                      type="text" 
                      value={editFormData.degree_year || ''} 
                      onChange={(e) => setEditFormData({ ...editFormData, degree_year: e.target.value })} 
                      className="w-full p-2 border border-[#EDEDED] rounded-lg text-xs" 
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEDED]">
                  <button 
                    type="button" 
                    onClick={() => setIsEditingProfile(false)} 
                    className="px-4 py-2 bg-[#EDEDED] text-[#0D0D0D] font-semibold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={actionLoading}
                    className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Change Problem Statement Allocation Modal */}
      {allocationModalIntern && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <h3 className="text-base font-bold text-[#0D0D0D]">Allocate Problem Statement</h3>
              <button onClick={() => setAllocationModalIntern(null)} className="text-[#9A9A9A] hover:text-[#0D0D0D]">✕</button>
            </div>

            <form onSubmit={handleExecuteAllocation} className="space-y-3 text-xs">
              <p>Intern: <strong className="text-[#0D0D0D]">{allocationModalIntern.name}</strong></p>
              <p>Current Project: <strong className="text-[#FF8A00]">{allocationModalIntern.problemStatement}</strong></p>

              <div>
                <label className="block font-bold text-[#0D0D0D] mb-1">Select New Problem Statement</label>
                <select
                  value={selectedPsId}
                  onChange={(e) => setSelectedPsId(e.target.value)}
                  className="w-full p-2 border border-[#EDEDED] rounded-lg text-xs"
                >
                  <option value="">-- Unassigned --</option>
                  {problemStatements.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0D0D0D] mb-1">Allocation Note / Reason</label>
                <textarea
                  value={allocationNote}
                  onChange={(e) => setAllocationNote(e.target.value)}
                  placeholder="Optional allocation note..."
                  className="w-full p-2 border border-[#EDEDED] rounded-lg text-xs h-20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEDED]">
                <button 
                  type="button" 
                  onClick={() => setAllocationModalIntern(null)} 
                  className="px-4 py-2 bg-[#EDEDED] text-[#0D0D0D] font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow disabled:opacity-50"
                >
                  {actionLoading ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Account Status Change */}
      {statusConfirmIntern && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 text-center">
            <AlertCircle className="h-10 w-10 text-[#FF8A00] mx-auto" />
            <h3 className="text-base font-bold text-[#0D0D0D]">Confirm Status Change</h3>
            <p className="text-xs text-[#9A9A9A]">
              Are you sure you want to change account status for <strong className="text-[#0D0D0D]">{statusConfirmIntern.name}</strong> to <strong className="text-[#FF8A00]">{targetNewStatus.toUpperCase()}</strong>?
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <button 
                onClick={() => setStatusConfirmIntern(null)} 
                className="px-4 py-2 bg-[#EDEDED] text-[#0D0D0D] font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmStatusChange}
                disabled={actionLoading}
                className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Yes, Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
