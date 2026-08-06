import React, { useState, useEffect } from 'react';
import { AnnouncementFilters as FilterType, AnnouncementFilterOptions } from '../../types/announcementTypes';

interface Props {
  filters: FilterType;
  options: AnnouncementFilterOptions | null;
  onFilterChange: (filters: FilterType) => void;
  onClearFilters: () => void;
  role: string;
}

export const AnnouncementFilters: React.FC<Props> = ({ filters, options, onFilterChange, onClearFilters, role }) => {
  const [localSearch, setLocalSearch] = useState(filters.search_text || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (filters.search_text || '')) {
        onFilterChange({ ...filters, search_text: localSearch });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, filters, onFilterChange]);

  const hasActiveFilters = 
    filters.search_text || 
    filters.status !== 'all' || 
    filters.priority !== 'all' || 
    filters.read_filter !== 'all' || 
    filters.is_pinned !== null ||
    filters.problem_statement_id !== 'all';

  return (
    <div className="bg-[#F7F7F7] border-b border-[#EDEDED] p-4 rounded-t-xl space-y-3">
      <div className="flex flex-col flex-wrap md:flex-row gap-3">
        <div className="flex-1 min-w-[200px]">
          <input 
            type="text" 
            placeholder="Search announcements..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full border-[#EDEDED] rounded-lg shadow-sm text-sm p-2 focus:ring-[#FF8A00] focus:border-[#FF8A00] outline-none border"
          />
        </div>
        
        <select 
          value={filters.status || 'all'} 
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="border-[#EDEDED] rounded-lg shadow-sm text-sm p-2 focus:ring-[#FF8A00] focus:border-[#FF8A00] outline-none border bg-white min-w-[120px]"
        >
          <option value="all">All Statuses</option>
          {options?.statuses?.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select 
          value={filters.priority || 'all'} 
          onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
          className="border-[#EDEDED] rounded-lg shadow-sm text-sm p-2 focus:ring-[#FF8A00] focus:border-[#FF8A00] outline-none border bg-white min-w-[120px]"
        >
          <option value="all">All Priorities</option>
          {options?.priorities?.map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>

        {role === 'intern' && (
          <select 
            value={filters.read_filter || 'all'} 
            onChange={(e) => onFilterChange({ ...filters, read_filter: e.target.value })}
            className="border-[#EDEDED] rounded-lg shadow-sm text-sm p-2 focus:ring-[#FF8A00] focus:border-[#FF8A00] outline-none border bg-white min-w-[120px]"
          >
            <option value="all">Read/Unread</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>
        )}

        <select 
          value={filters.problem_statement_id || 'all'} 
          onChange={(e) => onFilterChange({ ...filters, problem_statement_id: e.target.value })}
          className="border-[#EDEDED] rounded-lg shadow-sm text-sm p-2 focus:ring-[#FF8A00] focus:border-[#FF8A00] outline-none border bg-white min-w-[150px]"
        >
          <option value="all">All Categories</option>
          {options?.problemStatements?.map(ps => (
            <option key={ps.id} value={ps.id}>{ps.title}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#171717]">
            <input 
              type="checkbox" 
              checked={filters.is_pinned === true} 
              onChange={(e) => onFilterChange({ ...filters, is_pinned: e.target.checked ? true : null })}
              className="rounded text-[#FF8A00] focus:ring-[#FF8A00]"
            />
            Pinned Only
          </label>
        </div>
        
        {hasActiveFilters && (
          <button 
            onClick={() => {
              setLocalSearch('');
              onClearFilters();
            }}
            className="text-[#FF8A00] hover:text-[#FF3D00] font-bold"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
};
