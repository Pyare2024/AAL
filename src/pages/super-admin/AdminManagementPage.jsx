import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { createAdminAccount } from '../../services/adminService';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Search,
  ArrowUpDown,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
  RefreshCw,
  X,
  Mail,
  Phone,
  ShieldAlert,
  ArrowLeft,
  MoreVertical,
  Trash2,
  FolderOpen,
  Info
} from 'lucide-react';

export function AdminManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateRoute = location.pathname.endsWith('/create');

  // Admin Roster & Metadata State
  const [admins, setAdmins] = useState([]);
  const [problemStatements, setProblemStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [psFilter, setPsFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modal / View States
  const [modalMode, setModalMode] = useState(null); // null, 'edit', 'details', 'allocations'
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Create / Edit Form State
  const [createFormData, setCreateFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    accountStatus: 'active',
    selectedPsIds: [],
  });

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    mobile: '',
    accountStatus: 'active',
    selectedPsIds: [],
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action Confirmation State
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchInitialData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setErrorMsg(null);
    try {
      const { data: psData } = await supabase
        .from('problem_statements')
        .select('id, title, slug, status')
        .order('title', { ascending: true });

      setProblemStatements(psData || []);

      const { data: adminRoles, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesErr) throw rolesErr;

      const adminUserIds = (adminRoles || []).map((r) => r.user_id);
      let profileRecords = [];

      if (adminUserIds.length > 0) {
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .in('id', adminUserIds)
          .order('created_at', { ascending: false });

        if (profErr) throw profErr;
        profileRecords = profiles || [];
      }

      const { data: adminPsData } = await supabase
        .from('admin_problem_statements')
        .select('admin_id, problem_statement_id, problem_statements(id, title)');

      const adminPsMap = {};
      (adminPsData || []).forEach((row) => {
        if (!adminPsMap[row.admin_id]) adminPsMap[row.admin_id] = [];
        if (row.problem_statements) {
          adminPsMap[row.admin_id].push(row.problem_statements);
        }
      });

      const { data: internPsData } = await supabase
        .from('profiles')
        .select('problem_statement_id, id')
        .not('problem_statement_id', 'is', null);

      const psInternMap = {};
      (internPsData || []).forEach((row) => {
        if (!psInternMap[row.problem_statement_id]) psInternMap[row.problem_statement_id] = new Set();
        psInternMap[row.problem_statement_id].add(row.id);
      });

      const enrichedAdmins = profileRecords.map((adm) => {
        const allocatedStatements = adminPsMap[adm.id] || [];
        const internSet = new Set();
        allocatedStatements.forEach((ps) => {
          if (psInternMap[ps.id]) {
            psInternMap[ps.id].forEach((iId) => internSet.add(iId));
          }
        });
        return {
          ...adm,
          allocated_statements: allocatedStatements,
          allocated_interns_count: internSet.size,
        };
      });

      setAdmins(enrichedAdmins);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setErrorMsg(err.message || 'Failed to load Admin accounts from Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        setConfirmAction(null);
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const validateCreateForm = useCallback(() => {
    const errors = {};
    if (!createFormData.fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!createFormData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(createFormData.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!createFormData.mobile.trim()) errors.mobile = 'Mobile number is required.';
    if (!createFormData.password) {
      errors.password = 'Temporary password is required.';
    } else if (createFormData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }
    if (createFormData.password !== createFormData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    const existing = admins.find(
      (a) => a.email.toLowerCase().trim() === createFormData.email.toLowerCase().trim()
    );
    if (existing) {
      errors.email = 'An Admin account with this email address already exists.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [createFormData, admins]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateCreateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await createAdminAccount({
        fullName: createFormData.fullName,
        email: createFormData.email,
        mobile: createFormData.mobile,
        password: createFormData.password,
        accountStatus: createFormData.accountStatus,
        selectedProblemStatementIds: createFormData.selectedPsIds,
      });

      setSuccessMsg(`Admin account "${createFormData.fullName}" created successfully!`);
      setCreateFormData({
        fullName: '', email: '', mobile: '', password: '', confirmPassword: '', accountStatus: 'active', selectedPsIds: [],
      });
      setFormErrors({});
      navigate('/super-admin/admins');
      await fetchInitialData(true);
    } catch (err) {
      console.error('Error in create admin submit:', err);
      setErrorMsg(err.message || 'Failed to create Admin account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setEditFormData({
      fullName: admin.full_name,
      mobile: admin.mobile || '',
      accountStatus: admin.account_status || 'active',
      selectedPsIds: (admin.allocated_statements || []).map((s) => s.id),
    });
    setFormErrors({});
    setModalMode('edit');
    setOpenDropdownId(null);
  };

  const openDetailsDrawer = (admin) => {
    setSelectedAdmin(admin);
    setModalMode('details');
    setOpenDropdownId(null);
  };

  const openAssignModal = (admin) => {
    setSelectedAdmin(admin);
    setEditFormData(prev => ({
      ...prev,
      selectedPsIds: (admin.allocated_statements || []).map((s) => s.id),
    }));
    setModalMode('allocations');
    setOpenDropdownId(null);
  };

  const validateEditForm = useCallback(() => {
    const errors = {};
    if (!editFormData.fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!editFormData.mobile.trim()) errors.mobile = 'Mobile number is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editFormData]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if ((modalMode === 'edit' && !validateEditForm()) || !selectedAdmin || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (modalMode === 'edit') {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            full_name: editFormData.fullName.trim(),
            mobile: editFormData.mobile.trim(),
            account_status: editFormData.accountStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedAdmin.id);
        if (profileErr) console.warn('Profile update note:', profileErr);
      }

      await supabase
        .from('admin_problem_statements')
        .delete()
        .eq('admin_id', selectedAdmin.id);

      if (editFormData.selectedPsIds.length > 0) {
        const allocPayload = editFormData.selectedPsIds.map((psId) => ({
          admin_id: selectedAdmin.id,
          problem_statement_id: psId,
        }));
        await supabase.from('admin_problem_statements').insert(allocPayload);
      }

      setSuccessMsg(`Admin account "${selectedAdmin.full_name}" updated successfully!`);
      closeModal();
      await fetchInitialData(true);
    } catch (err) {
      console.error('Error updating admin:', err);
      setErrorMsg(err.message || 'Failed to update Admin account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatusClick = (admin) => {
    const newStatus = admin.account_status === 'active' ? 'inactive' : 'active';
    const isDeactivating = newStatus === 'inactive';
    setConfirmAction({
      admin,
      newStatus,
      title: isDeactivating ? 'Deactivate Admin' : 'Reactivate Admin',
      message: isDeactivating
        ? `Are you sure you want to deactivate "${admin.full_name}"? They will lose dashboard access immediately.`
        : `Are you sure you want to reactivate "${admin.full_name}"? This will restore their dashboard access.`,
    });
    setOpenDropdownId(null);
  };

  const handleDeleteClick = (admin) => {
    setConfirmAction({
      admin,
      newStatus: 'deleted',
      title: 'Delete Admin Account',
      message: `Are you sure you want to permanently delete "${admin.full_name}"? This action cannot be undone.`,
    });
    setOpenDropdownId(null);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction?.admin || isSubmitting) return;
    const { admin, newStatus } = confirmAction;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', admin.id);
      
      if (error) throw error;
      
      if (newStatus === 'deleted') {
        setSuccessMsg(`Admin "${admin.full_name}" has been deleted.`);
      } else {
        setSuccessMsg(`Admin "${admin.full_name}" has been ${newStatus === 'active' ? 'reactivated' : 'deactivated'}.`);
      }
      
      setConfirmAction(null);
      await fetchInitialData(true);
    } catch (err) {
      console.error('Error in confirm action:', err);
      setErrorMsg(err.message || 'Failed to execute action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedAdmin(null);
    setFormErrors({});
  };

  const { filteredAdmins, sortedAdmins } = useMemo(() => {
    const filtered = admins.filter((admin) => {
      if (admin.account_status === 'deleted') return false;
      const matchesSearch =
        !searchQuery ||
        admin.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (admin.mobile && admin.mobile.includes(searchQuery));
      const matchesStatus = statusFilter === 'all' || admin.account_status === statusFilter;
      const matchesPs =
        psFilter === 'all' ||
        (admin.allocated_statements || []).some((ps) => ps.id === psFilter);
      return matchesSearch && matchesStatus && matchesPs;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === 'name') return (a.full_name || '').localeCompare(b.full_name || '');
      return 0;
    });
    return { filteredAdmins: filtered, sortedAdmins: sorted };
  }, [admins, searchQuery, statusFilter, psFilter, sortBy]);

  const kpis = useMemo(() => {
    const validAdmins = admins.filter(a => a.account_status !== 'deleted');
    return {
      total: validAdmins.length,
      active: validAdmins.filter(a => a.account_status === 'active').length,
      inactive: validAdmins.filter(a => a.account_status !== 'active').length,
      unassigned: validAdmins.filter(a => (a.allocated_statements || []).length === 0).length,
      managedInterns: validAdmins.reduce((sum, a) => sum + (a.allocated_interns_count || 0), 0),
      coveredPs: new Set(validAdmins.flatMap(a => (a.allocated_statements || []).map(p => p.id))).size
    };
  }, [admins]);

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  if (isCreateRoute) {
    return (
      <div className="space-y-6 text-[#171717] pb-12">
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4">
          <div>
            <Link to="/super-admin/admins" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF8A00] hover:underline mb-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Admin Roster</span>
            </Link>
            <h1 className="text-2xl font-bold">Create Admin Account</h1>
            <p className="text-sm text-[#737373] mt-0.5">Provision a new Administrator account and allocate initial responsibilities.</p>
          </div>
        </div>

        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm max-w-3xl">
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <AdminProfileForm 
              formData={createFormData} 
              setFormData={setCreateFormData} 
              formErrors={formErrors} 
              mode="create" 
            />

            <div className="pt-4 border-t border-[#EDEDED]">
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-2">
                Allocate Initial Problem Statements
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {problemStatements.length === 0 && <p className="text-xs text-[#737373] italic">No Problem Statements available.</p>}
                {problemStatements.map((ps) => (
                  <label key={ps.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${createFormData.selectedPsIds.includes(ps.id) ? 'border-[#FF8A00] bg-orange-50/30' : 'border-[#EDEDED] hover:bg-[#F7F7F7]'}`}>
                    <input
                      type="checkbox"
                      checked={createFormData.selectedPsIds.includes(ps.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCreateFormData(prev => ({
                          ...prev,
                          selectedPsIds: checked 
                            ? [...prev.selectedPsIds, ps.id] 
                            : prev.selectedPsIds.filter(id => id !== ps.id)
                        }));
                      }}
                      className="h-4 w-4 text-[#FF8A00] rounded border-[#EDEDED] focus:ring-[#FF8A00] cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#171717] leading-tight">{ps.title}</span>
                      <span className="text-[10px] text-[#9A9A9A] uppercase font-bold mt-0.5">
                        {ps.status === 'active' ? 'Active Project' : 'Archived Project'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-6 flex items-center justify-end gap-3 border-t border-[#EDEDED]">
              <Link to="/super-admin/admins" className="px-5 py-2 bg-white border border-[#EDEDED] rounded-xl text-sm font-bold text-[#171717] hover:bg-[#F7F7F7] transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#FF8A00] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#FF3D00] disabled:opacity-50 transition-colors flex items-center gap-2">
                {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                <span>{isSubmitting ? 'Creating...' : 'Create Administrator'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-[#171717]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Admin Management</h1>
          <p className="text-sm text-[#737373] mt-1 max-w-2xl">Manage platform administrators, assign Problem Statements, monitor workload and control administrator access.</p>
        </div>
        <Link to="/super-admin/admins/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF8A00] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#FF3D00] transition-colors whitespace-nowrap">
          <Plus className="h-4 w-4" />
          <span>Create Admin</span>
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:bg-emerald-100 p-1 rounded-lg" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMsg ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-red-800">Unable to load administrators</h3>
          <p className="text-sm text-red-600 mt-1 mb-4">{errorMsg}</p>
          <button onClick={() => fetchInitialData(false)} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-xl shadow-sm hover:bg-red-700 transition-colors">
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 bg-white border border-[#EDEDED] rounded-2xl shadow-sm animate-pulse" />)}
          </div>
          <div className="h-64 bg-white border border-[#EDEDED] rounded-2xl shadow-sm animate-pulse" />
        </div>
      ) : (
        <>
          {(kpis.unassigned > 0 || kpis.inactive > 0 || problemStatements.length > kpis.coveredPs) && (
            <div className="flex flex-col sm:flex-row gap-3">
              {kpis.unassigned > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm shadow-sm font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{kpis.unassigned} {kpis.unassigned === 1 ? 'Admin has' : 'Admins have'} no assigned Problem Statements.</span>
                </div>
              )}
              {kpis.inactive > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm shadow-sm font-medium">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{kpis.inactive} Inactive {kpis.inactive === 1 ? 'Admin' : 'Admins'}.</span>
                </div>
              )}
              {problemStatements.length > kpis.coveredPs && (
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm shadow-sm font-medium">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>Problem Statements without Admins detected.</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="Total Admins" value={kpis.total} />
            <KpiCard title="Active Admins" value={kpis.active} />
            <KpiCard title="Inactive Admins" value={kpis.inactive} />
            <KpiCard title="Unassigned Admins" value={kpis.unassigned} />
            <KpiCard title="Managed Interns" value={kpis.managedInterns} />
            <KpiCard title="Problem Statement Coverage" value={`${kpis.coveredPs} / ${problemStatements.length}`} />
          </div>

          <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
                <input
                  type="text"
                  placeholder="Search admin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm focus:outline-none focus:border-[#FF8A00] focus:bg-white transition-all shadow-inner"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-32 px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm font-medium focus:outline-none focus:border-[#FF8A00] focus:bg-white cursor-pointer shadow-inner"
                aria-label="Filter by Status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={psFilter}
                onChange={(e) => setPsFilter(e.target.value)}
                className="w-full md:w-48 px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm font-medium focus:outline-none focus:border-[#FF8A00] focus:bg-white cursor-pointer shadow-inner truncate"
                aria-label="Filter by Problem Statement"
              >
                <option value="all">All Statements</option>
                {problemStatements.map(ps => (
                  <option key={ps.id} value={ps.id}>{ps.title}</option>
                ))}
              </select>

              <div className="flex items-center gap-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl px-3 py-2 shadow-inner">
                <ArrowUpDown className="h-4 w-4 text-[#9A9A9A]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer p-0"
                  aria-label="Sort Admins"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => fetchInitialData(false)}
              className="p-2 bg-white border border-[#EDEDED] rounded-xl hover:bg-[#F7F7F7] text-[#737373] transition-colors shrink-0 shadow-sm"
              title="Refresh Data"
              aria-label="Refresh Table"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {admins.length === 0 ? (
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-[#9A9A9A]" />
              </div>
              <h3 className="text-xl font-bold text-[#171717] mb-2">No Administrators Found</h3>
              <p className="text-[#737373] text-sm max-w-sm mb-6">Create your first administrator to begin managing interns and problem statements across the platform.</p>
              <Link to="/super-admin/admins/create" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FF8A00] text-white font-bold rounded-xl shadow-md hover:bg-[#FF3D00] transition-colors">
                <Plus className="h-4 w-4" />
                <span>Create Admin</span>
              </Link>
            </div>
          ) : sortedAdmins.length === 0 ? (
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center">
              <Search className="h-8 w-8 text-[#9A9A9A] mb-4" />
              <h3 className="text-lg font-bold text-[#171717] mb-1">No matching admins</h3>
              <p className="text-[#737373] text-sm">Adjust your search or filters to see results.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#F7F7F7] border-b border-[#EDEDED] text-[#737373] text-xs uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">Admin</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Assigned Problem Statements</th>
                      <th className="px-6 py-4">Managed Interns</th>
                      <th className="px-6 py-4">Last Login</th>
                      <th className="px-6 py-4">Created Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEDED]">
                    {sortedAdmins.map((admin) => {
                      const initials = admin.full_name ? admin.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD';
                      const isDropdownOpen = openDropdownId === admin.id;

                      return (
                        <tr key={admin.id} className="hover:bg-orange-50/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF3D00] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                {initials}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-[#171717]">{admin.full_name}</span>
                                <span className="text-xs text-[#737373]">{admin.email}</span>
                                {admin.mobile && <span className="text-xs text-[#9A9A9A] mt-0.5">{admin.mobile}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={admin.account_status} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-[250px]">
                              {(admin.allocated_statements || []).length === 0 ? (
                                <span className="text-xs text-[#9A9A9A] italic">Unassigned</span>
                              ) : (
                                <>
                                  {(admin.allocated_statements || []).slice(0, 2).map(ps => (
                                    <span key={ps.id} className="px-2 py-1 bg-[#F7F7F7] border border-[#EDEDED] text-[#171717] text-[10px] font-bold rounded-lg truncate max-w-[120px]">
                                      {ps.title}
                                    </span>
                                  ))}
                                  {(admin.allocated_statements || []).length > 2 && (
                                    <span className="px-2 py-1 bg-white border border-[#EDEDED] text-[#737373] text-[10px] font-bold rounded-lg">
                                      +{(admin.allocated_statements.length - 2)} More
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center justify-center px-2.5 py-1 bg-[#F7F7F7] border border-[#EDEDED] rounded-lg text-xs font-bold text-[#171717]">
                              {admin.allocated_interns_count || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#737373] font-medium text-xs">
                            {formatDate(admin.last_sign_in_at)}
                          </td>
                          <td className="px-6 py-4 text-[#737373] font-medium text-xs">
                            {formatDate(admin.created_at)}
                          </td>
                          <td className="px-6 py-4 text-right relative">
                            <button 
                              onClick={() => setOpenDropdownId(isDropdownOpen ? null : admin.id)}
                              className="p-1.5 rounded-lg text-[#9A9A9A] hover:text-[#171717] hover:bg-[#F7F7F7] transition-colors focus:ring-2 focus:ring-[#FF8A00] outline-none"
                              aria-haspopup="true"
                              aria-expanded={isDropdownOpen}
                              aria-label="Actions menu"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                            
                            {isDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} role="presentation" aria-hidden="true" />
                                <div className="absolute right-6 top-10 w-48 bg-white border border-[#EDEDED] rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                                  <DropdownItem icon={Eye} label="View Details" onClick={() => openDetailsDrawer(admin)} />
                                  <DropdownItem icon={Edit} label="Edit Profile" onClick={() => openEditModal(admin)} />
                                  <DropdownItem icon={FolderOpen} label="Assign Statements" onClick={() => openAssignModal(admin)} />
                                  <div className="h-px bg-[#EDEDED] my-1" />
                                  <DropdownItem 
                                    icon={admin.account_status === 'active' ? XCircle : CheckCircle2} 
                                    label={admin.account_status === 'active' ? 'Deactivate' : 'Reactivate'} 
                                    onClick={() => handleToggleStatusClick(admin)} 
                                  />
                                  <DropdownItem icon={Trash2} label="Delete" destructive onClick={() => handleDeleteClick(admin)} />
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Details Drawer */}
      {modalMode === 'details' && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} role="presentation" aria-hidden="true" />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-[#EDEDED] flex items-center justify-between bg-white shrink-0">
              <h2 id="drawer-title" className="text-lg font-bold text-[#171717]">Admin Details</h2>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-[#F7F7F7] text-[#737373] transition-colors" aria-label="Close details">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF3D00] text-white flex items-center justify-center font-bold text-2xl shadow-md">
                  {selectedAdmin.full_name ? selectedAdmin.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#171717]">{selectedAdmin.full_name}</h3>
                  <p className="text-sm text-[#737373] font-medium">Administrator</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedAdmin.account_status} />
                  </div>
                </div>
              </div>

              <div className="bg-[#F7F7F7] border border-[#EDEDED] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-[#9A9A9A]" />
                  <span className="font-semibold text-[#171717]">{selectedAdmin.email}</span>
                </div>
                {selectedAdmin.mobile && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-[#9A9A9A]" />
                    <span className="font-semibold text-[#171717]">{selectedAdmin.mobile}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-[#9A9A9A]" />
                  <span className="font-medium text-[#737373]">Created: {formatDate(selectedAdmin.created_at)}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-[#171717] uppercase tracking-wider">Assigned Problem Statements</h4>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 bg-orange-50 text-[#FF8A00] text-xs font-bold rounded-full">
                    {(selectedAdmin.allocated_statements || []).length}
                  </span>
                </div>
                {(selectedAdmin.allocated_statements || []).length === 0 ? (
                  <div className="p-4 border border-dashed border-[#EDEDED] rounded-xl text-center">
                    <p className="text-sm text-[#9A9A9A] font-medium">No Problem Statements assigned.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedAdmin.allocated_statements.map(ps => (
                      <div key={ps.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#EDEDED] rounded-lg shadow-sm">
                        <FolderOpen className="h-3.5 w-3.5 text-[#FF8A00]" />
                        <span className="text-xs font-bold text-[#171717]">{ps.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#171717] uppercase tracking-wider mb-3">Managed Interns</h4>
                <div className="p-4 bg-white border border-[#EDEDED] rounded-xl shadow-sm flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#737373]">Total Interns</span>
                  <span className="text-xl font-black text-[#171717]">{selectedAdmin.allocated_interns_count || 0}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#EDEDED] bg-[#F7F7F7] shrink-0 flex flex-col gap-2">
              <button onClick={() => openAssignModal(selectedAdmin)} className="w-full py-2.5 bg-[#FF8A00] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#FF3D00] transition-colors">
                Assign Problem Statements
              </button>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(selectedAdmin)} className="flex-1 py-2.5 bg-white border border-[#EDEDED] text-[#171717] rounded-xl text-sm font-bold hover:bg-[#F7F7F7] transition-colors">
                  Edit Profile
                </button>
                <button onClick={() => { closeModal(); handleToggleStatusClick(selectedAdmin); }} className="flex-1 py-2.5 bg-white border border-[#EDEDED] text-[#171717] rounded-xl text-sm font-bold hover:bg-[#F7F7F7] transition-colors">
                  {selectedAdmin.account_status === 'active' ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit & Assign Modal */}
      {(modalMode === 'edit' || modalMode === 'allocations') && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} role="presentation" aria-hidden="true" />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#EDEDED] flex justify-between items-center shrink-0">
              <h2 id="modal-title" className="text-xl font-bold text-[#171717]">
                {modalMode === 'edit' ? 'Edit Administrator Profile' : 'Assign Problem Statements'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-[#F7F7F7] text-[#9A9A9A] transition-colors" aria-label="Close modal">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="admin-action-form" onSubmit={handleEditSubmit} className="space-y-5">
                {modalMode === 'edit' && (
                  <AdminProfileForm formData={editFormData} setFormData={setEditFormData} formErrors={formErrors} mode="edit" />
                )}
                {modalMode === 'allocations' && (
                  <div className="space-y-3">
                    <p className="text-sm text-[#737373] mb-4">
                      Select the problem statements that <span className="font-bold text-[#171717]">{selectedAdmin.full_name}</span> will oversee.
                    </p>
                    <div className="border border-[#EDEDED] rounded-xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar bg-[#F7F7F7]">
                      {problemStatements.length === 0 ? (
                        <div className="p-4 text-center text-sm text-[#9A9A9A]">No Problem Statements available.</div>
                      ) : (
                        <div className="divide-y divide-[#EDEDED]">
                          {problemStatements.map(ps => (
                            <label key={ps.id} className="flex items-center gap-3 p-3 hover:bg-white cursor-pointer transition-colors group">
                              <input
                                type="checkbox"
                                checked={editFormData.selectedPsIds.includes(ps.id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setEditFormData(prev => ({
                                    ...prev, 
                                    selectedPsIds: checked ? [...prev.selectedPsIds, ps.id] : prev.selectedPsIds.filter(id => id !== ps.id)
                                  }));
                                }}
                                className="h-4 w-4 text-[#FF8A00] border-[#EDEDED] rounded focus:ring-[#FF8A00]"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-[#171717] group-hover:text-[#FF8A00] transition-colors">{ps.title}</span>
                                <span className="text-[10px] uppercase font-bold text-[#9A9A9A] mt-0.5">{ps.status === 'active' ? 'Active' : 'Archived'}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-5 border-t border-[#EDEDED] bg-[#F7F7F7] shrink-0 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={closeModal} className="px-4 py-2 bg-white border border-[#EDEDED] rounded-xl text-sm font-bold text-[#171717] hover:bg-[#F7F7F7] transition-colors">
                Cancel
              </button>
              <button form="admin-action-form" type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#FF8A00] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#FF3D00] disabled:opacity-50 transition-colors flex items-center gap-2">
                {isSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)} role="presentation" aria-hidden="true" />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className={`mx-auto w-12 h-12 rounded-full mb-4 flex items-center justify-center ${confirmAction.newStatus === 'deleted' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 id="confirm-title" className="text-xl font-bold text-[#171717] mb-2">{confirmAction.title}</h3>
            <p className="text-[#737373] text-sm mb-6">{confirmAction.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm font-bold text-[#171717] hover:bg-[#EDEDED] transition-colors">
                Cancel
              </button>
              <button onClick={executeConfirmAction} disabled={isSubmitting} className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${confirmAction.newStatus === 'deleted' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#FF8A00] hover:bg-[#FF3D00]'}`}>
                {isSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// Helper Components
// -------------------------------------------------------------

function AdminProfileForm({ formData, setFormData, formErrors, mode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
          Full Name <span className="text-[#FF8A00]">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Dr. Rajesh Kulkarni"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className={`w-full px-3.5 py-2.5 bg-white border ${formErrors.fullName ? 'border-red-500 bg-red-50/20' : 'border-[#EDEDED]'} rounded-xl text-sm text-[#171717] focus:outline-none focus:border-[#FF8A00] transition-all shadow-sm`}
        />
        {formErrors.fullName && <p className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /><span>{formErrors.fullName}</span></p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
          Mobile Number <span className="text-[#FF8A00]">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. +91 9823011223"
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          className={`w-full px-3.5 py-2.5 bg-white border ${formErrors.mobile ? 'border-red-500 bg-red-50/20' : 'border-[#EDEDED]'} rounded-xl text-sm text-[#171717] focus:outline-none focus:border-[#FF8A00] transition-all shadow-sm`}
        />
        {formErrors.mobile && <p className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /><span>{formErrors.mobile}</span></p>}
      </div>

      {mode === 'edit' && (
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
            Account Status <span className="text-[#FF8A00]">*</span>
          </label>
          <select
            value={formData.accountStatus}
            onChange={(e) => setFormData({ ...formData, accountStatus: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-white border border-[#EDEDED] rounded-xl text-sm text-[#171717] focus:outline-none focus:border-[#FF8A00] transition-all shadow-sm cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value }) {
  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
      <span className="text-[11px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-2">{title}</span>
      <span className="text-2xl font-black text-[#171717]">{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Active' },
    inactive: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: 'Inactive' },
    suspended: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Suspended' },
    deleted: { color: 'text-[#9A9A9A]', bg: 'bg-[#F7F7F7]', border: 'border-[#EDEDED]', label: 'Deleted' },
  };
  const cfg = map[status] || map.inactive;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function DropdownItem({ icon: Icon, label, onClick, destructive }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:bg-gray-50 ${destructive ? 'text-red-600 hover:bg-red-50' : 'text-[#171717] hover:bg-[#F7F7F7] hover:text-[#FF8A00]'}`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
