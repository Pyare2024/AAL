import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

/**
 * ManagementFilterBar component for all Super Admin overview and listing pages.
 * Supports exactly four independent filters:
 * 1. All (Combined / Default Status reset)
 * 2. College
 * 3. City
 * 4. Problem Statement
 * Plus Search & Reset controls.
 */
export function ManagementFilterBar({
  filters = {},
  onFilterChange,
  onReset,
  problemStatementOptions = [],
  collegeOptions = [],
  cityOptions = [],
  statusOptions = [],
  placeholderSearch = "Search by Name, Email, Mobile, ID...",
}) {
  const handleChange = (field, value) => {
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        [field]: value,
      });
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder={placeholderSearch}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 transition-all font-medium"
          />
        </div>

        {/* 1. FILTER: All (Overall Status / View Selector) */}
        <div className="w-full sm:w-auto min-w-[130px]">
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
          >
            <option value="all">All Records</option>
            {statusOptions.length > 0 ? (
              statusOptions.map((st, idx) => (
                <option key={idx} value={typeof st === 'object' ? st.value : st}>
                  {typeof st === 'object' ? st.label : st}
                </option>
              ))
            ) : (
              <>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </>
            )}
          </select>
        </div>

        {/* 2. FILTER: College */}
        <div className="w-full sm:w-auto min-w-[160px]">
          <select
            value={filters.college || 'all'}
            onChange={(e) => handleChange('college', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
          >
            <option value="all">College: All</option>
            {collegeOptions.map((c, idx) => (
              <option key={idx} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* 3. FILTER: City */}
        <div className="w-full sm:w-auto min-w-[140px]">
          <select
            value={filters.city || 'all'}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
          >
            <option value="all">City: All</option>
            {cityOptions.map((ct, idx) => (
              <option key={idx} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        </div>

        {/* 4. FILTER: Problem Statement */}
        <div className="w-full sm:w-auto min-w-[200px]">
          <select
            value={filters.problemStatement || 'all'}
            onChange={(e) => handleChange('problemStatement', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
          >
            <option value="all">Problem Statement: All</option>
            {problemStatementOptions.map((ps, idx) => (
              <option key={idx} value={typeof ps === 'object' ? ps.id || ps.value : ps}>
                {typeof ps === 'object' ? ps.title || ps.label : ps}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-2.5 bg-[#F7F7F7] hover:bg-[#FF3D00]/10 hover:text-[#FF3D00] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] flex items-center gap-1.5 transition-all shrink-0 ml-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
