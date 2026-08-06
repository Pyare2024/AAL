import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { feedbackService } from '../../services/feedbackService';
import { FeedbackTicket, FeedbackSummary } from '../../types/feedbackTypes';
import { FeedbackHeader } from '../../components/feedback/FeedbackHeader';
import { FeedbackSummary as FeedbackSummaryWidget } from '../../components/feedback/FeedbackSummary';
import { FeedbackTicketList } from '../../components/feedback/FeedbackTicketList';
import { FeedbackEmptyState, FeedbackErrorState } from '../../components/feedback/FeedbackStates';
import { FeedbackDetailDrawer } from '../../components/feedback/FeedbackDetailDrawer';
import { NewFeedbackForm } from '../../components/feedback/NewFeedbackForm';
import { FeedbackFilters, FeedbackFilterState } from '../../components/feedback/FeedbackFilters';
import { FeedbackPagination } from '../../components/feedback/FeedbackPagination';

export const SharedFeedbackPage: React.FC = () => {
  const { profile, role } = useAuth();
  const viewerId = (profile as any)?.id || '';
  const effectiveRole = role || 'intern';
  
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewFormOpen, setIsNewFormOpen] = useState(false);

  const handleOpenDrawer = (ticket: FeedbackTicket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTicket(null);
  };
  
  // Pagination and Filtering State
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FeedbackFilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    assigned_to_me: false,
  });
  
  const fetchFeedback = async (isCancelled: () => boolean, refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsInitialLoading(true);
    
    setError(null);
    try {
      const [summaryData, ticketData] = await Promise.all([
        feedbackService.getFeedbackSummary(),
        feedbackService.fetchFeedbackTickets({ 
          ...filters,
          page: currentPage,
          pageSize: 20
        })
      ]);
      
      if (!isCancelled()) {
        setSummary(summaryData);
        setTickets(ticketData.rows);
        setTotalCount(ticketData.total_count);
        setTotalPages(ticketData.total_pages);
        
        // Use a state setter callback to prevent dependency loop
        setSelectedTicket((prev) => {
          if (!prev) return null;
          const updated = ticketData.rows.find(t => t.id === prev.id);
          return updated || prev;
        });
      }
    } catch (err: any) {
      if (!isCancelled()) {
        setError(err.message || 'Failed to load feedback');
      }
    } finally {
      if (!isCancelled()) {
        if (refresh) setIsRefreshing(false);
        else setIsInitialLoading(false);
      }
    }
  };

  const loadData = useCallback(() => fetchFeedback(() => false, true), [filters, currentPage]);

  useEffect(() => {
    let cancelled = false;
    fetchFeedback(() => cancelled, false);
    return () => {
      cancelled = true;
    };
  }, [filters, currentPage]);

  const handleFilterChange = (newFilters: FeedbackFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const handleCreateFeedback = async (data: any) => {
    await feedbackService.createFeedbackTicket(data);
    setIsNewFormOpen(false);
    setCurrentPage(1); // Go to page 1 to see the new ticket
    loadData();
  };

  if (error && tickets.length === 0) {
    return <FeedbackErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <FeedbackHeader role={effectiveRole} onNewClick={() => setIsNewFormOpen(true)} />
      
      {summary && <FeedbackSummaryWidget summary={summary} role={effectiveRole} />}
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <FeedbackFilters 
          filters={filters} 
          onChange={handleFilterChange} 
          role={effectiveRole}
        />

        <div className="p-4 relative">
          {isRefreshing && (
            <div className="absolute top-2 right-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></span>
              Updating...
            </div>
          )}
          {isInitialLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          ) : tickets.length > 0 ? (
            <FeedbackTicketList tickets={tickets} onTicketClick={handleOpenDrawer} />
          ) : (
            <FeedbackEmptyState />
          )}
        </div>

        {!isInitialLoading && tickets.length > 0 && (
          <FeedbackPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <FeedbackDetailDrawer 
        ticket={selectedTicket} 
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer} 
        role={effectiveRole} 
        viewerId={viewerId}
        onTicketUpdated={loadData}
      />

      {isNewFormOpen && (
        <NewFeedbackForm 
          onClose={() => setIsNewFormOpen(false)} 
          onSubmit={handleCreateFeedback} 
        />
      )}
    </div>
  );
};
