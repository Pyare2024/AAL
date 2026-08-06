import React, { useState, useEffect } from 'react';

export interface FeedbackFilterState {
  search: string;
  status: string;
  priority: string;
  category: string;
  assigned_to_me?: boolean;
}

interface Props {
  filters: FeedbackFilterState;
  onChange: (filters: FeedbackFilterState) => void;
  role: string;
}

export const FeedbackFilters: React.FC<Props> = ({ filters, onChange, role }) => {
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onChange({ ...filters, search: localSearch });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, filters, onChange]);

  const handleClearAll = () => {
    setLocalSearch('');
    onChange({
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      ...(role !== 'intern' ? { assigned_to_me: false } : {})
    });
  };

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.priority !== 'all' || filters.category !== 'all' || filters.assigned_to_me;

  return (
    <div className="bg-gray-50 border-b border-gray-200 p-4 rounded-t-xl space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Search by subject, ticket number, or author..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full border-gray-300 rounded-lg shadow-sm text-sm p-2 focus:ring-blue-500 focus:border-blue-500 outline-none border"
          />
        </div>
        
        <select 
          value={filters.status} 
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="border-gray-300 rounded-lg shadow-sm text-sm p-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white min-w-[120px]"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="awaiting_reply">Awaiting Reply</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select 
          value={filters.priority} 
          onChange={(e) => onChange({ ...filters, priority: e.target.value })}
          className="border-gray-300 rounded-lg shadow-sm text-sm p-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white min-w-[120px]"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select 
          value={filters.category} 
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="border-gray-300 rounded-lg shadow-sm text-sm p-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white min-w-[120px]"
        >
          <option value="all">All Categories</option>
          <option value="platform_issue">Platform Issue</option>
          <option value="program_suggestion">Suggestion</option>
          <option value="academic_query">Academic Query</option>
          <option value="mentor_complaint">Complaint</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-4">
          {(role === 'admin' || role === 'super_admin') && (
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
              <input 
                type="checkbox" 
                checked={filters.assigned_to_me || false} 
                onChange={(e) => onChange({ ...filters, assigned_to_me: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              Assigned to Me
            </label>
          )}
        </div>
        
        {hasActiveFilters && (
          <button 
            onClick={handleClearAll}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
};
