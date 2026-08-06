import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import {
  fetchLeaderboard,
  fetchFilterOptions,
} from '../../services/leaderboardService';
import {
  LeaderboardHeader,
  LeaderboardSummary,
  TopPerformers,
  LeaderboardFilterBar,
  ActiveFilterChips,
  LeaderboardTable,
  LeaderboardMobileCard,
  LeaderboardPagination,
  InternDetailsDrawer,
} from '../../components/leaderboard/LeaderboardComponents';
import {
  LeaderboardRow,
  LeaderboardSummaryData,
  FilterState,
  FilterOptions,
  PaginationState,
  SortField,
  SortState,
  ViewerRole,
} from '../../types/leaderboardTypes';
import { Loader2, Search, SlidersHorizontal } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Shared Leaderboard Page
// Rendered identically on all three routes:
//   /intern/leaderboard
//   /admin/leaderboard
//   /super-admin/engagement/leaderboard
//
// Role differences are handled via:
//   - viewerRole resolved from AuthContext
//   - backend-provided is_self / isAssigned flags on each row
//   - applyLeaderboardPrivacy() in the service layer
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared default state (used by clearAll) ───────────────────────────────

const EMPTY_SUMMARY: LeaderboardSummaryData = {
  totalRanked: 0,
  topPerformerName: '—',
  topPerformerScore: 0,
  averageScore: 0,
  top3: [],
};

/** Canonical default filter state. Used by clearAll and initial mount. */
const DEFAULT_FILTERS: FilterState = {
  search: '',
  city: '',
  problemStatementId: '',
};

/** Canonical default sort state. Used by clearAll and initial mount. */
const DEFAULT_SORT: SortState = { field: 'rank', dir: 'asc' };

/** Canonical default pagination. Page resets to 1 on any filter/sort change. */
const DEFAULT_PAGINATION: PaginationState = { page: 1, pageSize: 25, total: 0 };

export function SharedLeaderboardPage() {
  // ── Auth context ─────────────────────────────────────────────────────────
  const { user, role, profile } = useAuth();

  // Step 3 — Viewer identity:
  // profile.id === auth.users.id for all users (confirmed from schema).
  // For interns: profile.id IS the intern's leaderboard ID.
  // The schema has no separate intern_id field — profiles.id is the PK that maps
  // directly to leaderboard_points.intern_id and user_roles.user_id.
  const viewerInternId: string = (profile as any)?.id ?? (user as any)?.id ?? '';

  // Resolve viewer role from AuthContext (the canonical role source)
  const rawRole: string =
    role ??
    (profile as any)?.role ??
    (user as any)?.user_metadata?.role ??
    'intern';

  const viewerRole: ViewerRole =
    rawRole === 'super_admin' ? 'super_admin' :
    rawRole === 'admin'       ? 'admin' :
                                'intern';

  // For admins: assignedInternIds are resolved server-side in fetchLeaderboard.
  // We pass an empty array here; the service fetches the real list from
  // admin_problem_statements → profiles. Passing [] is safe and secure.
  const assignedInternIds: string[] = [];

  // ── State ─────────────────────────────────────────────────────────────────
  const [rows, setRows]             = useState<LeaderboardRow[]>([]);
  const [summary, setSummary]       = useState<LeaderboardSummaryData>(EMPTY_SUMMARY);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [filters, setFilters]       = useState<FilterState>(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort]             = useState<SortState>(DEFAULT_SORT);
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ cities: [], problemStatements: [] });
  const [showCategories, setShowCategories] = useState(false);
  const [selectedRow, setSelectedRow] = useState<LeaderboardRow | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ── Step 4: Debounce search (300–500ms per spec) ─────────────────────────
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((v: string) => {
    setFilters((f) => ({ ...f, search: v }));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(v);
      // Pagination reset triggered by the useEffect dependency below
    }, 350);
  }, []);

  // ── Load filter options once ──────────────────────────────────────────────
  useEffect(() => {
    fetchFilterOptions().then((opts) => setFilterOptions(opts));
  }, []);

  // ── Load leaderboard data ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const effectiveFilters: FilterState = { ...filters, search: debouncedSearch };
      const result = await fetchLeaderboard(
        effectiveFilters,
        sort,
        pagination.page,
        pagination.pageSize,
        viewerRole,
        viewerInternId,
        assignedInternIds
      );
      setRows(result.rows);
      setSummary(result.summary);
      setPagination((p) => ({ ...p, total: result.total }));
    } catch {
      setError('Unable to load leaderboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.city, filters.problemStatementId, sort, pagination.page, pagination.pageSize, viewerRole, viewerInternId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Step 4: Reset page to 1 on ANY filter/sort change ────────────────────
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch, filters.city, filters.problemStatementId, sort]);

  // ── Sort handler ──────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    setSort((s) =>
      s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }
    );
    // Sort change → page 1 handled by the useEffect above
  };

  // ── Step 4: Clear All — resets ALL state to canonical defaults ───────────
  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearch('');
    setSort(DEFAULT_SORT);
    setPagination(DEFAULT_PAGINATION); // explicit page-1 reset
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  };

  // Helper: remove a single filter chip
  const handleRemoveSearch = () => {
    setFilters((f) => ({ ...f, search: '' }));
    setDebouncedSearch('');
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-full">

      {/* Header */}
      <LeaderboardHeader totalRanked={summary.totalRanked} />

      {/* Summary stat cards */}
      {!loading && (
        <LeaderboardSummary summary={summary} viewerRole={viewerRole} />
      )}

      {/* Top 3 Podium */}
      {!loading && summary.top3.length > 0 && (
        <TopPerformers top3={summary.top3} onSelectIntern={setSelectedRow} />
      )}

      {/* Filter Bar — desktop only */}
      <div className="hidden sm:block">
        <LeaderboardFilterBar
          filters={filters}
          filterOptions={filterOptions}
          onSearchChange={handleSearchChange}
          onCityChange={(v) => setFilters((f) => ({ ...f, city: v }))}
          onPSChange={(v) => setFilters((f) => ({ ...f, problemStatementId: v }))}
        />
      </div>

      {/* Mobile: search row + filter button */}
      <div className="sm:hidden flex gap-2">
        {/* Step 5: correct placeholder text + search icon */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373] pointer-events-none" />
          <input
            id="leaderboard-search-mobile"
            type="text"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email, contact or intern ID..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#EDEDED] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#FF8A00]"
          />
        </div>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EDEDED] rounded-xl text-xs font-bold text-[#737373] hover:bg-gray-50 min-w-[44px] min-h-[44px] justify-center"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Filters</span>
          {(filters.city || filters.problemStatementId) && (
            <span className="w-4 h-4 bg-[#FF8A00] text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {[filters.city, filters.problemStatementId].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Mobile filter drawer (bottom sheet) */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative bg-white rounded-t-2xl p-5 space-y-4 shadow-2xl z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-[#171717]">Filters</p>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-[#737373] hover:text-[#171717] p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">City</label>
              <select
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs"
              >
                <option value="">All Cities</option>
                {filterOptions.cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">Problem Statement</label>
              <select
                value={filters.problemStatementId}
                onChange={(e) => setFilters((f) => ({ ...f, problemStatementId: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs"
              >
                <option value="">All Problem Statements</option>
                {filterOptions.problemStatements.map((ps) => <option key={ps.id} value={ps.id}>{ps.title}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { clearAll(); setMobileFiltersOpen(false); }}
                className="flex-1 py-2.5 text-xs font-bold text-[#737373] bg-[#F5F5F5] border border-[#EDEDED] rounded-xl min-h-[44px]"
              >
                Clear All
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] rounded-xl min-h-[44px]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips + result count */}
      <ActiveFilterChips
        filters={filters}
        filterOptions={filterOptions}
        onRemoveSearch={handleRemoveSearch}
        onRemoveCity={() => setFilters((f) => ({ ...f, city: '' }))}
        onRemovePS={() => setFilters((f) => ({ ...f, problemStatementId: '' }))}
        onClearAll={clearAll}
        total={loading ? 0 : pagination.total}
        grandTotal={summary.totalRanked}
      />

      {/* Category column toggle (admin/super_admin only) */}
      {viewerRole !== 'intern' && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCategories((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#737373] bg-white border border-[#EDEDED] rounded-xl hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {showCategories ? 'Hide' : 'Show'} Category Columns
          </button>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-[#FF8A00] animate-spin" />
        </div>
      )}

      {/* Error state — preserves filters, never shows fake data */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-bold text-red-700 mb-1">Unable to load leaderboard</p>
          <p className="text-xs text-red-500 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={load}
              className="px-4 py-2 text-xs font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 text-xs font-bold text-[#737373] bg-[#F5F5F5] border border-[#EDEDED] rounded-xl hover:bg-gray-200 transition-colors"
            >
              Clear Filters & Retry
            </button>
          </div>
        </div>
      )}

      {/* Main content — desktop table + mobile cards */}
      {!loading && !error && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <LeaderboardTable
              rows={rows}
              sort={sort}
              onSort={handleSort}
              viewerRole={viewerRole}
              onViewDetail={setSelectedRow}
              showCategoryColumns={showCategories}
              onClearFilters={clearAll}
            />
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {rows.length === 0 ? (
              <div className="bg-white border border-dashed border-[#EDEDED] rounded-2xl p-10 text-center">
                <p className="text-sm font-bold text-[#171717] mb-1">No interns match the selected filters.</p>
                <p className="text-xs text-[#737373] mb-4">Try adjusting your search or clearing filters.</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={clearAll}
                    className="py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] rounded-xl"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={clearAll}
                    className="py-2 text-xs font-bold text-[#737373] hover:text-[#171717] transition-colors"
                  >
                    Return to All Interns
                  </button>
                </div>
              </div>
            ) : (
              rows.map((row) => (
                <LeaderboardMobileCard
                  key={row.internId}
                  row={row}
                  onViewDetail={setSelectedRow}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <LeaderboardPagination
              pagination={pagination}
              onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
              onPageSizeChange={(ps) => setPagination((prev) => ({ ...prev, pageSize: ps, page: 1 }))}
            />
          )}
        </>
      )}

      {/* Detail Drawer */}
      {selectedRow && (
        <InternDetailsDrawer
          row={selectedRow}
          viewerRole={viewerRole}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}
