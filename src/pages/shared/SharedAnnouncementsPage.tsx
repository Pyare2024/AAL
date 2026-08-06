import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { announcementService } from '../../services/announcementService';
import { supabase } from '../../lib/supabase';
import { 
  Announcement, 
  AnnouncementFilters as FilterType, 
  AnnouncementSummary as SummaryType,
  AnnouncementFilterOptions 
} from '../../types/announcementTypes';
import { AnnouncementHeader } from '../../components/announcements/AnnouncementHeader';
import { AnnouncementSummary } from '../../components/announcements/AnnouncementSummary';
import { AnnouncementFilters } from '../../components/announcements/AnnouncementFilters';
import { AnnouncementFeed } from '../../components/announcements/AnnouncementFeed';
import { AnnouncementPagination } from '../../components/announcements/AnnouncementPagination';
import { AnnouncementDetailDrawer } from '../../components/announcements/AnnouncementDetailDrawer';
import { AnnouncementComposer } from '../../components/announcements/AnnouncementComposer';
import { AnnouncementEmptyState, AnnouncementErrorState } from '../../components/announcements/AnnouncementStates';

export const SharedAnnouncementsPage: React.FC = () => {
  const { role, profile } = useAuth();
  const effectiveRole = role || 'intern';
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<AnnouncementFilterOptions | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<'create' | 'edit'>('create');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterType>({
    search_text: '',
    status: 'all',
    priority: 'all',
    read_filter: 'all',
    is_pinned: null,
    problem_statement_id: 'all',
    date_from: null,
    date_to: null,
  });

  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });

  const fetchLock = useRef(false);

  const loadData = useCallback(async (silent = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;

    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const [feedData, summaryData, optionsData] = await Promise.all([
        announcementService.fetchAnnouncements({ ...filters, page: pagination.page, page_size: pagination.pageSize }),
        announcementService.fetchAnnouncementSummary(),
        announcementService.fetchAnnouncementFilterOptions()
      ]);
      setAnnouncements(feedData.rows);
      setPagination(prev => ({
        ...prev,
        page: feedData.page,
        pageSize: feedData.page_size,
        totalPages: feedData.total_pages,
        totalCount: feedData.total_count
      }));
      setSummary(summaryData);
      setFilterOptions(optionsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setIsLoading(false);
      fetchLock.current = false;
    }
  }, [filters, pagination.page, effectiveRole]);

  useEffect(() => {
    loadData();
    
    // Supabase Realtime subscription for automatic updates on mutations or pg_cron
    const channel = supabase
      .channel('public:announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        loadData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleFilterChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleClearFilters = () => {
    handleFilterChange({
      search_text: '',
      status: 'all',
      priority: 'all',
      read_filter: 'all',
      is_pinned: null,
      problem_statement_id: 'all',
      date_from: null,
      date_to: null,
    });
  };

  const handleReadStateChange = async (id: string, isRead: boolean) => {
    try {
      if (isRead) {
        await announcementService.markAsRead(id);
      } else {
        await announcementService.markAsUnread(id);
      }
      setAnnouncements(prev => prev.map(a => 
        a.id === id ? { ...a, read_state: { is_read: isRead, read_at: isRead ? new Date().toISOString() : undefined } } : a
      ));
      // Optimistically update summary counts if intern
      if (effectiveRole === 'intern') {
        setSummary((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            unread: isRead ? Math.max(0, prev.unread - 1) : prev.unread + 1,
            read: isRead ? prev.read + 1 : Math.max(0, prev.read - 1)
          };
        });
      }
    } catch (err) {
      console.error('Failed to change read state', err);
    }
  };

  if (error && announcements.length === 0) {
    return <AnnouncementErrorState message={error} onRetry={loadData} />;
  }

  const hasActiveFilters = Object.entries(filters).some(([key, val]) => {
    if (key === 'search_text') return !!val;
    if (key === 'is_pinned') return val !== null;
    return val !== 'all' && val !== null;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AnnouncementHeader role={effectiveRole} onNewClick={() => {
        setComposerMode('create');
        setEditingAnnouncementId(null);
        setComposerOpen(true);
      }} />
      
      {summary && <AnnouncementSummary summary={summary} role={effectiveRole} isLoading={isLoading} />}
      
      <div className="bg-white rounded-xl shadow-sm border border-[#EDEDED]">
        <AnnouncementFilters 
          filters={filters} 
          options={filterOptions} 
          onFilterChange={handleFilterChange} 
          onClearFilters={handleClearFilters}
          role={effectiveRole}
        />
        
        <div className="p-4">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-[#F7F7F7] rounded-xl" />
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <AnnouncementFeed 
              announcements={announcements}
              onViewDetails={a => setSelectedAnnouncementId(a.id)}
              onReadStateChange={effectiveRole === 'intern' ? handleReadStateChange : undefined}
              onEdit={a => {
                setComposerMode('edit');
                setEditingAnnouncementId(a.id);
                setComposerOpen(true);
              }}
              onRefresh={loadData}
            />
          ) : (
            <AnnouncementEmptyState hasFilters={hasActiveFilters} onClearFilters={handleClearFilters} />
          )}
        </div>

        {!isLoading && announcements.length > 0 && (
          <AnnouncementPagination 
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalCount={pagination.totalCount}
            totalPages={pagination.totalPages}
            onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
          />
        )}
      </div>

      {selectedAnnouncementId && (
        <AnnouncementDetailDrawer 
          announcementId={selectedAnnouncementId}
          onClose={() => setSelectedAnnouncementId(null)}
          onReadStateChange={effectiveRole === 'intern' ? handleReadStateChange : undefined}
          onEdit={(a) => {
            setComposerMode('edit');
            setEditingAnnouncementId(a.id);
            setComposerOpen(true);
            setSelectedAnnouncementId(null); // Optional: close drawer when editing
          }}
          onRefresh={loadData}
        />
      )}

      {composerOpen && (
        <AnnouncementComposer 
          mode={composerMode}
          initialAnnouncementId={editingAnnouncementId}
          onClose={() => setComposerOpen(false)}
          onSuccess={async () => {
            setPagination(p => ({ ...p, page: 1 }));
            await loadData(true);
          }}
        />
      )}
    </div>
  );
};
