import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/context/AuthContext';
import { ManagementFilterBar } from '../../components/common/ManagementFilterBar';
import { 
  Users, 
  FileText, 
  Clock, 
  Calendar,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export function AdminActiveInternsPage() {
  const { user, profile } = useAuth();
  
  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignedStatements, setAssignedStatements] = useState([]);
  const [activeInterns, setActiveInterns] = useState([]);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPs, setFilterPs] = useState('all');
  const [filterOnboarding, setFilterOnboarding] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    try {
      // 1. Fetch assigned Problem Statements for the logged-in Admin
      const { data: psData, error: psErr } = await supabase
        .from('admin_problem_statements')
        .select('problem_statement_id, problem_statements(id, title)')
        .eq('admin_id', user.id);
        
      if (psErr) throw psErr;
      
      const statements = (psData || []).map(row => row.problem_statements).filter(Boolean);
      setAssignedStatements(statements);
      
      const statementIds = statements.map(s => s.id);
      
      if (statementIds.length === 0) {
        // No assigned problem statements = no interns
        setActiveInterns([]);
        setPendingReviewsCount(0);
        return;
      }
      
      // 2. Fetch Active Interns assigned to these problem statements
      const { data: internsData, error: internsErr } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          mobile,
          account_status,
          onboarding_status,
          created_at,
          problem_statement_id
        `)
        .in('problem_statement_id', statementIds)
        .eq('account_status', 'active');
        
      if (internsErr) throw internsErr;
      
      setActiveInterns(internsData || []);
      
      // 3. Fetch Pending Reviews for these active interns
      const internIds = (internsData || []).map(i => i.id);
      if (internIds.length > 0) {
        const { count: reviewsCount, error: reviewsErr } = await supabase
          .from('daily_diary_entries')
          .select('id', { count: 'exact', head: true })
          .in('intern_id', internIds)
          .eq('status', 'submitted');
          
        if (reviewsErr) throw reviewsErr;
        setPendingReviewsCount(reviewsCount || 0);
      } else {
        setPendingReviewsCount(0);
      }
      
    } catch (err) {
      console.error('Error loading Active Interns data:', err);
      setError('Failed to load active interns data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Derived Metrics
  const recentlyJoinedCount = activeInterns.filter(intern => {
    const createdDate = new Date(intern.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdDate >= sevenDaysAgo;
  }).length;

  const statementTitleMap = Object.fromEntries(
    assignedStatements.map((statement) => [
      statement.id,
      statement.title,
    ])
  );

  // Filtered & Sorted Interns
  const processedInterns = activeInterns
    .filter(intern => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        (intern.full_name?.toLowerCase() || '').includes(q) ||
        (intern.email?.toLowerCase() || '').includes(q) ||
        (intern.mobile || '').includes(q);
        
      const matchesPs = filterPs === 'all' || intern.problem_statement_id === filterPs;
      const matchesOnboarding = filterOnboarding === 'all' || intern.onboarding_status === filterOnboarding;
      
      return matchesSearch && matchesPs && matchesOnboarding;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'name-asc') return (a.full_name || '').localeCompare(b.full_name || '');
      if (sortBy === 'name-desc') return (b.full_name || '').localeCompare(a.full_name || '');
      return 0;
    });

  // Extract unique onboarding statuses for filter
  const onboardingStatuses = Array.from(new Set(activeInterns.map(i => i.onboarding_status).filter(Boolean)));

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF8A00]" />
        <p className="mt-4 text-[#9A9A9A] text-sm font-semibold">Loading allocated active interns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-[#0D0D0D] mb-2">Error Loading Data</h3>
        <p className="text-sm text-[#9A9A9A] mb-6">{error}</p>
        <button
          onClick={loadData}
          className="px-6 py-2.5 bg-[#0D0D0D] text-white text-sm font-bold rounded-xl hover:bg-[#FF8A00] transition-colors"
        >
          Retry Fetching Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <span>Role Access: Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Allocated Active Interns</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            View and manage active interns assigned to your Problem Statements.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 bg-[#F7F7F7] hover:bg-[#EDEDED] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider block">
              Total Active Interns
            </span>
            <h3 className="text-2xl font-extrabold text-[#0D0D0D] mt-1">{activeInterns.length}</h3>
          </div>
        </div>

        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-[#FF8A00]/10 text-[#FF8A00] rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider block">
              Assigned Problem Statements
            </span>
            <h3 className="text-2xl font-extrabold text-[#0D0D0D] mt-1">{assignedStatements.length}</h3>
          </div>
        </div>

        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider block">
              Recently Joined (7 days)
            </span>
            <h3 className="text-2xl font-extrabold text-[#0D0D0D] mt-1">{recentlyJoinedCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider block">
              Pending Reviews
            </span>
            <h3 className="text-2xl font-extrabold text-[#0D0D0D] mt-1">{pendingReviewsCount}</h3>
          </div>
        </div>
      </div>

      {/* Filters and List Section */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm">
        
        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
            <input 
              type="text" 
              placeholder="Search interns by name, email, or mobile..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/20 focus:border-[#FF8A00]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterPs}
              onChange={(e) => setFilterPs(e.target.value)}
              className="px-3 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm font-semibold text-[#0D0D0D] focus:outline-none"
            >
              <option value="all">All Problem Statements</option>
              {assignedStatements.map(ps => (
                <option key={ps.id} value={ps.id}>{ps.title}</option>
              ))}
            </select>

            <select
              value={filterOnboarding}
              onChange={(e) => setFilterOnboarding(e.target.value)}
              className="px-3 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm font-semibold text-[#0D0D0D] focus:outline-none"
            >
              <option value="all">All Onboarding Statuses</option>
              {onboardingStatuses.map(status => (
                <option key={status} value={status}>{status.replace(/_/g, ' ').toUpperCase()}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm font-semibold text-[#0D0D0D] focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#EDEDED]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F7F7F7] border-b border-[#EDEDED]">
                <th className="px-4 py-3 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Intern</th>
                <th className="px-4 py-3 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Problem Statement</th>
                <th className="px-4 py-3 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED]">
              {processedInterns.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-4 bg-[#F7F7F7] rounded-full mb-3 text-[#9A9A9A]">
                        <Users className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-bold text-[#0D0D0D]">No active interns found</p>
                      <p className="text-xs text-[#9A9A9A] mt-1">Active interns assigned to your Problem Statements will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                processedInterns.map((intern) => (
                  <tr key={intern.id} className="hover:bg-[#F7F7F7]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF3D00] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          {getInitials(intern.full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0D0D0D]">{intern.full_name || 'Unknown User'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#0D0D0D]">{intern.email}</p>
                      <p className="text-xs text-[#9A9A9A]">{intern.mobile || 'No mobile'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#F7F7F7] border border-[#EDEDED] text-xs font-semibold text-[#0D0D0D]">
                        {statementTitleMap[intern.problem_statement_id] || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-4 py-3 space-y-1">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {intern.account_status}
                        </span>
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          {(intern.onboarding_status || '').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[#0D0D0D]">
                        {new Date(intern.created_at).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
