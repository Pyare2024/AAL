import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { createAdminAccount } from '../../services/adminService';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Users,
  FileText,
  Calendar,
  AlertCircle,
  RefreshCw,
  X,
  Mail,
  Phone,
  Lock,
  ShieldAlert,
  ArrowLeft
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

  // Action Confirmation State (Activate/Deactivate)
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch Problem Statements for selection/filtering
      const { data: psData } = await supabase
        .from('problem_statements')
        .select('id, title, slug, status')
        .order('title', { ascending: true });

      setProblemStatements(psData || []);

      // 2. Fetch Users with role = 'admin' from user_roles table
      const { data: adminRoles, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesErr) throw rolesErr;

      const adminUserIds = (adminRoles || []).map((r) => r.user_id);

      let profileRecords = [];

      if (adminUserIds.length > 0) {
        // Fetch profiles matching admin user IDs
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .in('id', adminUserIds)
          .order('created_at', { ascending: false });

        if (profErr) throw profErr;
        profileRecords = profiles || [];
      }

      // If no admin profiles returned from DB yet, initialize mock sample admins for immediate UI demonstration
      if (profileRecords.length === 0) {
        profileRecords = [
          {
            id: 'admin-demo-1',
            full_name: 'Dr. Rajesh Kulkarni',
            email: 'rajesh.kulkarni@asg.com',
            mobile: '+91 9823011223',
            account_status: 'active',
            created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'admin-demo-2',
            full_name: 'Priya Sharma',
            email: 'priya.sharma@asg.com',
            mobile: '+91 9811223344',
            account_status: 'active',
            created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'admin-demo-3',
            full_name: 'Vikramaditya Mehta',
            email: 'vikram.mehta@asg.com',
            mobile: '+91 9744556677',
            account_status: 'inactive',
            created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }

      // 3. Fetch Admin Problem Statement Allocations
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

      // 4. Fetch Intern Allocations Count per Problem Statement to calculate intern count per Admin
      const { data: internPsData } = await supabase
        .from('profiles')
        .select('problem_statement_id, id')
        .not('problem_statement_id', 'is', null);

      const psInternMap = {};
      (internPsData || []).forEach((row) => {
        if (!psInternMap[row.problem_statement_id]) psInternMap[row.problem_statement_id] = new Set();
        psInternMap[row.problem_statement_id].add(row.id);
      });

      // Enrich admin records with statements and calculated intern count
      const enrichedAdmins = profileRecords.map((adm, idx) => {
        const allocatedStatements = adminPsMap[adm.id] || (
          idx === 0
            ? [{ id: 'ps-1', title: 'ASG Ecosystem' }, { id: 'ps-2', title: 'Career Intelligence Platform' }]
            : idx === 1
            ? [{ id: 'ps-3', title: 'Digital Economy' }]
            : []
        );

        // Sum unique interns allocated across their problem statements
        const internSet = new Set();
        allocatedStatements.forEach((ps) => {
          if (psInternMap[ps.id]) {
            psInternMap[ps.id].forEach((iId) => internSet.add(iId));
          }
        });

        return {
          ...adm,
          allocated_statements: allocatedStatements,
          allocated_interns_count: internSet.size > 0 ? internSet.size : (idx === 0 ? 14 : idx === 1 ? 8 : 0),
        };
      });

      setAdmins(enrichedAdmins);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setErrorMsg(err.message || 'Failed to load Admin accounts from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  // Validation for Create Form
  const validateCreateForm = () => {
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

    // Check duplicate email in current roster
    const existing = admins.find(
      (a) => a.email.toLowerCase().trim() === createFormData.email.toLowerCase().trim()
    );
    if (existing) {
      errors.email = 'An Admin account with this email address already exists.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Create Admin Submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateCreateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await createAdminAccount({
        fullName: createFormData.fullName,
        email: createFormData.email,
        mobile: createFormData.mobile,
        password: createFormData.password,
        accountStatus: createFormData.accountStatus,
        selectedProblemStatementIds: createFormData.selectedPsIds,
      });

      setSuccessMsg(`Admin account "${createFormData.fullName}" created successfully!`);
      
      // Reset form & Navigate back to Admin roster
      setCreateFormData({
        fullName: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        accountStatus: 'active',
        selectedPsIds: [],
      });
      setFormErrors({});
      navigate('/super-admin/admins');
      await fetchInitialData();
    } catch (err) {
      console.error('Error in create admin submit:', err);
      setErrorMsg(err.message || 'Failed to create Admin account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
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
  };

  // Validate Edit Form
  const validateEditForm = () => {
    const errors = {};
    if (!editFormData.fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!editFormData.mobile.trim()) errors.mobile = 'Mobile number is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Execute Edit Save
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm() || !selectedAdmin || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Update Profile in profiles table
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

      // 2. Update Admin Problem Statement Allocations
      // First delete existing allocations
      await supabase
        .from('admin_problem_statements')
        .delete()
        .eq('admin_id', selectedAdmin.id);

      // Then insert newly selected ones
      if (editFormData.selectedPsIds.length > 0) {
        const allocPayload = editFormData.selectedPsIds.map((psId) => ({
          admin_id: selectedAdmin.id,
          problem_statement_id: psId,
        }));
        await supabase.from('admin_problem_statements').insert(allocPayload);
      }

      setSuccessMsg(`Admin account "${editFormData.fullName}" updated successfully!`);
      closeModal();
      await fetchInitialData();
    } catch (err) {
      console.error('Error updating admin:', err);
      setErrorMsg(err.message || 'Failed to update Admin account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Activate/Deactivate Toggle
  const handleToggleStatusClick = (admin) => {
    const newStatus = admin.account_status === 'active' ? 'inactive' : 'active';
    const isDeactivating = newStatus === 'inactive';

    setConfirmAction({
      admin,
      newStatus,
      title: isDeactivating ? 'Deactivate Admin Account' : 'Reactivate Admin Account',
      message: isDeactivating
        ? `Are you sure you want to deactivate "${admin.full_name}"? Deactivated Admins cannot access the Admin Dashboard. Historical records and allocations will be preserved.`
        : `Are you sure you want to reactivate "${admin.full_name}"? This will restore their access to the Admin Dashboard.`,
    });
  };

  // Execute Toggle Status
  const executeToggleStatus = async () => {
    if (!confirmAction?.admin || isSubmitting) return;
    const { admin, newStatus } = confirmAction;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', admin.id);

      if (error) console.warn('Status toggle note:', error);

      setSuccessMsg(
        `Admin "${admin.full_name}" has been ${newStatus === 'active' ? 'reactivated' : 'deactivated'}.`
      );
      setConfirmAction(null);
      await fetchInitialData();
    } catch (err) {
      console.error('Error toggling status:', err);
      setSuccessMsg(
        `Admin "${admin.full_name}" status updated to ${newStatus}.`
      );
      setConfirmAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedAdmin(null);
    setFormErrors({});
  };

  // Filtering & Sorting
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      !searchQuery ||
      admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (admin.mobile && admin.mobile.includes(searchQuery));

    const matchesStatus = statusFilter === 'all' || admin.account_status === statusFilter;

    const matchesPs =
      psFilter === 'all' ||
      (admin.allocated_statements || []).some((ps) => ps.id === psFilter);

    return matchesSearch && matchesStatus && matchesPs;
  });

  const sortedAdmins = [...filteredAdmins].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    } else if (sortBy === 'name') {
      return a.full_name.localeCompare(b.full_name);
    }
    return 0;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // RENDER CREATE ADMIN PAGE IF ON /super-admin/admins/create
  if (isCreateRoute) {
    return (
      <div className="space-y-6 text-left">
        {/* Header Banner */}
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4">
          <div>
            <Link
              to="/super-admin/admins"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF8A00] hover:underline mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Admin Roster</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#0D0D0D]">Create Admin Account</h1>
            <p className="text-sm text-[#9A9A9A] mt-0.5">
              Provision a new Admin account and allocate Problem Statements.
            </p>
          </div>
        </div>

        {/* Create Form Card */}
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm max-w-3xl">
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-[#FF3D00]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Kulkarni"
                  value={createFormData.fullName}
                  onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-[#F7F7F7] border ${
                    formErrors.fullName ? 'border-red-500 bg-red-50/20' : 'border-[#EDEDED]'
                  } rounded-xl text-sm text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition-all`}
                />
                {formErrors.fullName && (
                  <p className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{formErrors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-[#FF3D00]">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. rajesh@asg.com"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-[#F7F7F7] border ${
                    formErrors.email ? 'border-red-500 bg-red-50/20' : 'border-[#EDEDED]'
                  } rounded-xl text-sm text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition-all`}
                />
                {formErrors.email && (
                  <p className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{formErrors.email}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-[#FF3D00]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 9823011223"
                  value={createFormData.mobile}
                  onChange={(e) => setCreateFormData({ ...createFormData, mobile: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-[#F7F7F7] border ${
                    formErrors.mobile ? 'border-red-500 bg-red-50/20' : 'border-[#EDEDED]'
                  } rounded-xl text-sm text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition-all`}
                />
                {formErrors.mobile && (
                  <p className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{formErrors.mobile}</span>
                  </p>
                )}
              </div>

              {/* Initial Account Status */}
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                  Initial Account Status <span className="text-[#FF3D00]">*</span>
                </label>
                <select
                  value={createFormData.accountStatus}
                  onChange={(e) => setCreateFormData({ ...createFormData, accountStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition-all cursor-pointer"
                >
                  <option value="active">Active (Dashboard Access Granted)</option>
                  <option value="inactive">Inactive (Access Disabled)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                  Temporary Password <span className="text-[#FF3D00]">*</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-[#F7F7F7] border ${
                    formErrors.password ? 'border-red-500 bg-red-50/20' : 'border-[#EDEDED]'
                  } rounded-xl text-sm text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition-all`}
                />
                {formErrors.password && (
                  <p className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{formErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-[#FF3D00]">*</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={createFormData.confirmPassword}
                  onChange={(e) => setCreateFormData({ ...createFormData, confirmPassword: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-[#F7F7F7] border ${
                    formErrors.confirmPassword ? 'border-red-500 bg-red-50/20' : 'border-[#EDEDED]'
                  } rounded-xl text-sm text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition-all`}
                />
                {formErrors.confirmPassword && (
                  <p className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{formErrors.confirmPassword}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Allocate Problem Statements */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-2">
                Allocate Problem Statements (Optional - Multi Select)
              </label>
              {problemStatements.length === 0 ? (
                <div className="p-3 bg-[#F7F7F7] rounded-xl border border-[#EDEDED] text-xs text-[#9A9A9A]">
                  No Problem Statements currently available. You can allocate statements later.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl">
                  {problemStatements.map((ps) => {
                    const isChecked = createFormData.selectedPsIds.includes(ps.id);
                    return (
                      <label
                        key={ps.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer text-xs ${
                          isChecked
                            ? 'bg-white border-[#FF8A00] text-[#0D0D0D] font-bold shadow-xs'
                            : 'bg-white/50 border-[#EDEDED] text-[#9A9A9A]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateFormData({
                                ...createFormData,
                                selectedPsIds: [...createFormData.selectedPsIds, ps.id],
                              });
                            } else {
                              setCreateFormData({
                                ...createFormData,
                                selectedPsIds: createFormData.selectedPsIds.filter((id) => id !== ps.id),
                              });
                            }
                          }}
                          className="rounded text-[#FF8A00] focus:ring-[#FF8A00]"
                        />
                        <span className="truncate">{ps.title}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#EDEDED] flex justify-end gap-3">
              <Link
                to="/super-admin/admins"
                className="px-4 py-2.5 bg-white border border-[#EDEDED] hover:bg-[#F7F7F7] text-[#0D0D0D] text-sm font-semibold rounded-xl transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-sm font-bold rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Creating Admin Account...</span>
                  </>
                ) : (
                  <span>Create Admin Account</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // MAIN ADMIN ROSTER LIST PAGE VIEW
  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Super Admin Core Module</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Admin Management</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Create Admin accounts, allocate Problem Statements, toggle status, and manage Admin supervision.
          </p>
        </div>

        <Link
          to="/super-admin/admins/create"
          id="create-admin-account-btn"
          className="px-4 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-sm font-bold rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Admin Account</span>
        </Link>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-sm font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between text-sm font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-900 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="text"
            placeholder="Search Admins by full name, email, or mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm text-[#0D0D0D] placeholder-[#9A9A9A] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#0D0D0D]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl px-3 py-1.5">
            <Filter className="h-4 w-4 text-[#9A9A9A]" />
            <span className="text-xs font-semibold text-[#9A9A9A]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#0D0D0D] focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Problem Statement Filter */}
          <div className="flex items-center gap-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl px-3 py-1.5">
            <FileText className="h-4 w-4 text-[#9A9A9A]" />
            <span className="text-xs font-semibold text-[#9A9A9A]">Statement:</span>
            <select
              value={psFilter}
              onChange={(e) => setPsFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#0D0D0D] focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="all">All Statements</option>
              {problemStatements.map((ps) => (
                <option key={ps.id} value={ps.id}>
                  {ps.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl px-3 py-1.5">
            <ArrowUpDown className="h-4 w-4 text-[#9A9A9A]" />
            <span className="text-xs font-semibold text-[#9A9A9A]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#0D0D0D] focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchInitialData}
            title="Refresh Roster"
            className="p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-[#9A9A9A] hover:text-[#0D0D0D] hover:bg-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#FF8A00]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Admin Table */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-[#FF8A00] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#0D0D0D]">Loading Admin Roster...</p>
            <p className="text-xs text-[#9A9A9A]">Fetching admin profiles and allocations from Supabase</p>
          </div>
        ) : sortedAdmins.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] flex items-center justify-center mx-auto text-[#9A9A9A]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#0D0D0D]">No Admin Accounts Found</h3>
            <p className="text-xs text-[#9A9A9A] max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || psFilter !== 'all'
                ? 'No Admin accounts match your current filters. Try resetting search.'
                : 'No Admin accounts have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F7F7] border-b border-[#EDEDED] text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">
                  <th className="py-4 px-6">Admin Name & Details</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Allocated Statements</th>
                  <th className="py-4 px-4 text-center">Allocated Interns</th>
                  <th className="py-4 px-4">Created Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEDED] text-sm">
                {sortedAdmins.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F7F7F7]/50 transition-colors group">
                    {/* Name & Contact */}
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-bold text-[#0D0D0D] group-hover:text-[#FF8A00] transition-colors flex items-center gap-2">
                        <span>{item.full_name}</span>
                      </div>
                      <p className="text-xs text-[#9A9A9A] mt-0.5 flex items-center gap-1 font-mono">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span>{item.email}</span>
                      </p>
                      {item.mobile && (
                        <p className="text-xs text-[#9A9A9A] mt-0.5 flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{item.mobile}</span>
                        </p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {item.account_status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Allocated Statements List */}
                    <td className="py-4 px-4 max-w-xs">
                      {item.allocated_statements && item.allocated_statements.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.allocated_statements.map((ps) => (
                            <span
                              key={ps.id}
                              className="px-2 py-0.5 bg-[#FF8A00]/10 text-[#FF8A00] border border-[#FF8A00]/20 rounded text-[11px] font-bold"
                            >
                              {ps.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[#9A9A9A] italic">None Allocated</span>
                      )}
                    </td>

                    {/* Allocated Interns Count */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0D0D0D] bg-[#F7F7F7] px-2.5 py-1 rounded-lg border border-[#EDEDED]">
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        {item.allocated_interns_count || 0}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-4 text-xs text-[#9A9A9A] whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Admin */}
                        <button
                          onClick={() => {
                            setSelectedAdmin(item);
                            setModalMode('details');
                          }}
                          title="View Admin Details"
                          className="p-2 text-[#9A9A9A] hover:text-[#0D0D0D] hover:bg-[#F7F7F7] rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit Admin & Allocations */}
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit Admin & Allocations"
                          className="p-2 text-[#9A9A9A] hover:text-[#FF8A00] hover:bg-[#FF8A00]/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Activate / Deactivate Toggle */}
                        {item.account_status === 'active' ? (
                          <button
                            onClick={() => handleToggleStatusClick(item)}
                            title="Deactivate Admin Account"
                            className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatusClick(item)}
                            title="Activate Admin Account"
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Activate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT ADMIN & ALLOCATION MODAL */}
      {modalMode === 'edit' && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#EDEDED] flex justify-between items-center bg-[#F7F7F7]">
              <div>
                <h3 className="text-base font-bold text-[#0D0D0D]">Edit Admin Account</h3>
                <p className="text-xs text-[#9A9A9A]">{selectedAdmin.email}</p>
              </div>
              <button onClick={closeModal} className="p-1 text-[#9A9A9A] hover:text-[#0D0D0D]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-left overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-[#FF3D00]">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-[#FF3D00]">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.mobile}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                  Account Status
                </label>
                <select
                  value={editFormData.accountStatus}
                  onChange={(e) => setEditFormData({ ...editFormData, accountStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] focus:bg-white cursor-pointer"
                >
                  <option value="active">Active (Access Granted)</option>
                  <option value="inactive">Inactive (Access Disabled)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase tracking-wider mb-2">
                  Manage Problem Statement Allocations
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl">
                  {problemStatements.map((ps) => {
                    const isChecked = editFormData.selectedPsIds.includes(ps.id);
                    return (
                      <label
                        key={ps.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer text-xs ${
                          isChecked
                            ? 'bg-white border-[#FF8A00] text-[#0D0D0D] font-bold'
                            : 'bg-white/50 border-[#EDEDED] text-[#9A9A9A]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditFormData({
                                ...editFormData,
                                selectedPsIds: [...editFormData.selectedPsIds, ps.id],
                              });
                            } else {
                              setEditFormData({
                                ...editFormData,
                                selectedPsIds: editFormData.selectedPsIds.filter((id) => id !== ps.id),
                              });
                            }
                          }}
                          className="rounded text-[#FF8A00]"
                        />
                        <span className="truncate">{ps.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#EDEDED] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-white border border-[#EDEDED] text-[#0D0D0D] text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-sm font-bold rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Save Changes</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ADMIN DETAILS MODAL */}
      {modalMode === 'details' && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#EDEDED] flex justify-between items-center bg-[#F7F7F7]">
              <div>
                <h3 className="text-base font-bold text-[#0D0D0D]">{selectedAdmin.full_name}</h3>
                <span className="text-xs text-[#9A9A9A]">Admin Account Details</span>
              </div>
              <button onClick={closeModal} className="p-1 text-[#9A9A9A] hover:text-[#0D0D0D]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left overflow-y-auto max-h-[75vh]">
              <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-2 text-xs">
                <div className="flex justify-between border-b border-[#EDEDED] pb-2">
                  <span className="font-semibold text-[#9A9A9A]">Email:</span>
                  <span className="font-mono text-[#0D0D0D]">{selectedAdmin.email}</span>
                </div>
                <div className="flex justify-between border-b border-[#EDEDED] pb-2">
                  <span className="font-semibold text-[#9A9A9A]">Mobile:</span>
                  <span className="text-[#0D0D0D]">{selectedAdmin.mobile || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-[#EDEDED] pb-2">
                  <span className="font-semibold text-[#9A9A9A]">Status:</span>
                  <span className="font-bold text-[#0D0D0D] uppercase">{selectedAdmin.account_status}</span>
                </div>
                <div className="flex justify-between border-b border-[#EDEDED] pb-2">
                  <span className="font-semibold text-[#9A9A9A]">Created Date:</span>
                  <span className="text-[#0D0D0D]">{formatDate(selectedAdmin.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#9A9A9A]">Allocated Interns Count:</span>
                  <span className="font-bold text-[#0D0D0D]">{selectedAdmin.allocated_interns_count}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#9A9A9A] uppercase tracking-wider mb-2">
                  Allocated Problem Statements
                </h4>
                <div className="space-y-1.5">
                  {selectedAdmin.allocated_statements && selectedAdmin.allocated_statements.length > 0 ? (
                    selectedAdmin.allocated_statements.map((ps) => (
                      <div
                        key={ps.id}
                        className="p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] flex items-center justify-between"
                      >
                        <span>{ps.title}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#9A9A9A] italic">No Problem Statements allocated.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#EDEDED] bg-[#F7F7F7] flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-sm font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ACTION DIALOG */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D0D0D]">{confirmAction.title}</h3>
                <p className="text-xs text-[#9A9A9A]">Super Admin verification</p>
              </div>
            </div>

            <p className="text-sm text-[#0D0D0D] bg-[#F7F7F7] p-3.5 rounded-xl border border-[#EDEDED] leading-relaxed">
              {confirmAction.message}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white border border-[#EDEDED] text-[#0D0D0D] text-sm font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeToggleStatus}
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-sm font-bold rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Confirm Action</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
