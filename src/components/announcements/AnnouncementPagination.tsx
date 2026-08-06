import React from 'react';

interface Props {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const AnnouncementPagination: React.FC<Props> = ({ page, pageSize, totalCount, totalPages, onPageChange }) => {
  if (totalCount === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-[#EDEDED] bg-white px-4 py-3 sm:px-6 rounded-b-xl">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="relative inline-flex items-center rounded-lg border border-[#EDEDED] bg-white px-4 py-2 text-sm font-medium text-[#171717] hover:bg-[#F7F7F7] disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="relative ml-3 inline-flex items-center rounded-lg border border-[#EDEDED] bg-white px-4 py-2 text-sm font-medium text-[#171717] hover:bg-[#F7F7F7] disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#737373]">
            Showing <span className="font-medium text-[#171717]">{totalCount === 0 ? 0 : (page - 1) * pageSize + 1}</span> to{' '}
            <span className="font-medium text-[#171717]">{Math.min(page * pageSize, totalCount)}</span> of{' '}
            <span className="font-medium text-[#171717]">{totalCount}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-l-lg px-2 py-2 text-[#9A9A9A] ring-1 ring-inset ring-[#EDEDED] hover:bg-[#F7F7F7] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="relative inline-flex items-center px-4 py-2 text-sm font-bold text-[#171717] ring-1 ring-inset ring-[#EDEDED]">
              {page} / {totalPages || 1}
            </div>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="relative inline-flex items-center rounded-r-lg px-2 py-2 text-[#9A9A9A] ring-1 ring-inset ring-[#EDEDED] hover:bg-[#F7F7F7] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
