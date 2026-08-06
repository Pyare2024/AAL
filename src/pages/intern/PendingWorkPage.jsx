import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PendingWorkCard, WorkSubmissionForm } from '../../components/productivity/PendingWorkComponents';

export function PendingWorkPage() {
  const [works, setWorks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'submitted' | 'changes_requested' | 'approved' | 'overdue'
  const [submittingWork, setSubmittingWork] = useState(null);

  const fetchPendingWorks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('pending_work_items')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setWorks(data || []);
    } catch (err) {
      console.error('[PendingWorkPage] Error fetching pending work:', err);
      setError(err.message || 'Failed to load pending work assignments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingWorks();
  }, []);

  const tabs = [
    { id: 'assigned', label: 'Assigned' },
    { id: 'submitted', label: 'Submitted' },
    { id: 'changes_requested', label: 'Changes Requested' },
    { id: 'approved', label: 'Approved' },
    { id: 'overdue', label: 'Overdue' }
  ];

  const filteredWorks = works.filter(w => {
    if (activeTab === 'assigned') return w.status === 'assigned' || w.status === 'draft';
    if (activeTab === 'submitted') return w.status === 'submitted';
    if (activeTab === 'changes_requested') return w.status === 'resubmission_required' || w.status === 'changes_requested';
    if (activeTab === 'approved') return w.status === 'approved';
    if (activeTab === 'overdue') return w.status === 'overdue';
    return true;
  });

  const handleFormSubmit = async (submissionData) => {
    // Perform optimistic UI update
    const previousWorks = [...works];
    try {
      setWorks(prev => prev.map(w => {
        if (w.id === submissionData.pending_work_id) {
          return { ...w, status: 'submitted' };
        }
        return w;
      }));
      setSubmittingWork(null);

      // Ensure the status updates on the backend pending_work_item if WorkSubmissionForm didn't already do it
      const { error } = await supabase
        .from('pending_work_items')
        .update({ status: 'submitted', updated_at: new Date().toISOString() })
        .eq('id', submissionData.pending_work_id);

      if (error) throw error;
    } catch (err) {
      console.error('Submission update failed:', err);
      setWorks(previousWorks);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-[#FF8A00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-8 bg-[#FFF4F2] border border-[#FFD9D2] rounded-2xl text-center">
        <h3 className="text-lg font-bold text-[#D32F2F]">Error loading pending work</h3>
        <p className="text-sm text-[#737373] mt-2 mb-4">{error}</p>
        <button onClick={fetchPendingWorks} className="px-4 py-2 bg-white border border-[#D32F2F] text-[#D32F2F] text-xs font-bold rounded-xl hover:bg-[#FFF4F2] transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wider block">Productivity Module</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">Pending Work & Submissions</h1>
        </div>
        <div className="p-12 bg-[#FAFAFA] border border-[#EDEDED] rounded-2xl text-center">
          <p className="text-sm font-bold text-[#737373]">No pending work assigned</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wider block">Productivity Module</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">Pending Work & Submissions</h1>
          <p className="text-xs text-[#737373] mt-1">View assigned formal tasks, submit deliverables, and track review status.</p>
        </div>
      </div>

      {submittingWork ? (
        <WorkSubmissionForm
          work={submittingWork}
          onSubmit={handleFormSubmit}
          onCancel={() => setSubmittingWork(null)}
        />
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="flex border-b border-[#EDEDED] overflow-x-auto gap-2 text-xs font-bold">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-3 px-4 border-b-2 whitespace-nowrap transition-all ${
                  activeTab === t.id ? 'border-[#FF8A00] text-[#FF8A00]' : 'border-transparent text-[#737373] hover:text-[#171717]'
                }`}
              >
                {t.label} ({works.filter(w => {
                  if (t.id === 'assigned') return w.status === 'assigned' || w.status === 'draft';
                  if (t.id === 'changes_requested') return w.status === 'resubmission_required' || w.status === 'changes_requested';
                  return w.status === t.id;
                }).length})
              </button>
            ))}
          </div>

          {/* List of Pending Works */}
          <div className="space-y-4">
            {filteredWorks.length === 0 ? (
              <div className="p-8 bg-[#FAFAFA] border border-[#EDEDED] rounded-2xl text-center">
                <p className="text-xs text-[#737373]">No work items currently under "{activeTab.replace('_', ' ')}".</p>
              </div>
            ) : (
              filteredWorks.map(work => (
                <PendingWorkCard
                  key={work.id}
                  work={work}
                  onSubmitProof={(w) => setSubmittingWork(w)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
