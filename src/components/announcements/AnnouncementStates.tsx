import React from 'react';

export const AnnouncementEmptyState = ({ hasFilters, onClearFilters }: { hasFilters?: boolean, onClearFilters?: () => void }) => (
  <div className="py-12 text-center text-[#737373]">
    <p className="mb-2 text-[#171717] font-semibold text-lg">No announcements found</p>
    <p className="text-sm">There are no announcements matching your criteria.</p>
    {hasFilters && onClearFilters && (
      <button onClick={onClearFilters} className="mt-4 px-4 py-2 bg-[#F7F7F7] hover:bg-[#EDEDED] rounded-xl text-[#171717] font-bold text-sm">
        Clear Filters
      </button>
    )}
  </div>
);

export const AnnouncementErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="py-12 text-center text-red-500">
    <p className="font-semibold text-lg mb-2">Error loading announcements</p>
    <p className="text-sm">{message}</p>
    <button onClick={onRetry} className="mt-4 px-4 py-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 font-bold text-sm">
      Retry
    </button>
  </div>
);
