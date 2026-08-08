import React, { useState, useEffect } from 'react';
import { 
  fetchPendingWorkForAdmin, 
  reviewPendingWork 
} from '../../services/pendingWorkService';
import { 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  ExternalLink, 
  Check, 
  Star,
  Sparkles,
  Award
} from 'lucide-react';

export function AdminPendingWorkReviewPage() {
  const [loading, setLoading] = useState(true);
  const [pendingWorkList, setPendingWorkList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Evaluation Modal State
  const [selectedWorkForReview, setSelectedWorkForReview] = useState(null);
  const [workGrade, setWorkGrade] = useState('A+');
  const [workStatus, setWorkStatus] = useState('Approved');
  const [workFeedback, setWorkFeedback] = useState('');
  const [submittingWorkReview, setSubmittingWorkReview] = useState(false);
  const [workReviewSuccess, setWorkReviewSuccess] = useState(false);

  const loadPendingWork = async () => {
    setLoading(true);
    try {
      const data = await fetchPendingWorkForAdmin(['ps-1', 'ps-2'], {
        search: searchTerm,
        status: statusFilter
      });
      setPendingWorkList(data);
    } catch (err) {
      console.error('[AdminPendingWorkReviewPage] Error fetching work:', err);
      setPendingWorkList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingWork();
  }, [statusFilter]);

  const handleOpenWorkReview = (work) => {
    setSelectedWorkForReview(work);
    setWorkGrade(work.grade || 'A+');
    setWorkStatus(work.status === 'Approved' ? 'Approved' : 'Approved');
    setWorkFeedback(work.admin_feedback || '');
    setWorkReviewSuccess(false);
  };

  const handleSendWorkReview = async () => {
    if (!selectedWorkForReview) return;
    setSubmittingWorkReview(true);
    try {
      const res = await reviewPendingWork(selectedWorkForReview.id, {
        status: workStatus,
        grade: workGrade,
        feedback: workFeedback
      });

      if (res.success) {
        setWorkReviewSuccess(true);
        setTimeout(() => {
          setSelectedWorkForReview(null);
          loadPendingWork();
        }, 1000);
      }
    } catch (err) {
      console.error('Error submitting work review:', err);
    } finally {
      setSubmittingWorkReview(false);
    }
  };

  const filteredWorkList = pendingWorkList.filter(work => {
    const matchesSearch = 
      work.task_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.internName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF8A00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF8A00] mb-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Admin Review Scope</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Allocated Intern Work Deliverables</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Inspect project deliverables, GitHub repositories, assign grades, and provide feedback to assigned interns.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="text"
            placeholder="Search deliverable title or intern..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-[#9A9A9A]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-semibold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
          >
            <option value="all">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Revision Requested">Revision Requested</option>
          </select>
        </div>
      </div>

      {/* Deliverable Cards List */}
      <div className="space-y-4">
        {filteredWorkList.map((work, idx) => (
          <div key={work.id ? `${work.id}-${idx}` : `work-${idx}`} className="p-5 bg-white border border-[#EDEDED] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#FF8A00] transition-all shadow-sm">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-[#0D0D0D]">{work.internName}</h4>
                <span className="text-xs text-[#9A9A9A]">({work.email})</span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  work.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : work.status === 'Revision Requested' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}>
                  {work.status}
                </span>
                {work.grade && (
                  <span className="text-[10px] font-black px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded-md flex items-center gap-1">
                    <Star className="h-3 w-3 fill-purple-600 text-purple-600" /> Grade: {work.grade}
                  </span>
                )}
              </div>

              <h5 className="text-xs font-extrabold text-[#FF8A00] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{work.task_title}</span>
              </h5>

              <p className="text-xs text-[#4A4A4A] leading-relaxed">{work.submission_notes}</p>

              {work.admin_feedback && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl">
                  <strong>Admin Feedback: </strong>{work.admin_feedback}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              {work.deliverable_url && (
                <a
                  href={work.deliverable_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#F7F7F7] border border-[#EDEDED] hover:border-[#FF8A00] text-xs font-bold rounded-xl text-[#0D0D0D] flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#FF8A00]" />
                  <span>Inspect Link</span>
                </a>
              )}

              <button
                onClick={() => handleOpenWorkReview(work)}
                className="px-4 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{work.status === 'Approved' ? 'Edit Evaluation' : 'Evaluate & Grade'}</span>
              </button>
            </div>
          </div>
        ))}

        {filteredWorkList.length === 0 && (
          <div className="p-8 bg-white border border-[#EDEDED] rounded-2xl text-center text-[#9A9A9A] text-xs">
            No pending work deliverables found for your assigned interns.
          </div>
        )}
      </div>

      {/* EVALUATION MODAL */}
      {selectedWorkForReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <div>
                <h3 className="font-extrabold text-base text-[#0D0D0D]">
                  Evaluate Deliverable — {selectedWorkForReview.internName}
                </h3>
                <p className="text-xs text-[#FF8A00] font-bold mt-0.5">{selectedWorkForReview.task_title}</p>
              </div>
              <button 
                onClick={() => setSelectedWorkForReview(null)}
                className="text-[#9A9A9A] hover:text-[#0D0D0D] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Assign Grade</label>
                <select
                  value={workGrade}
                  onChange={(e) => setWorkGrade(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                >
                  <option value="A+">A+ (Outstanding / Exceptional)</option>
                  <option value="A">A (Excellent Quality)</option>
                  <option value="B">B (Good / Meets Expectation)</option>
                  <option value="Needs Revision">Needs Revision</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Review Decision Status</label>
                <select
                  value={workStatus}
                  onChange={(e) => setWorkStatus(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                >
                  <option value="Approved">Approved</option>
                  <option value="Revision Requested">Revision Requested</option>
                  <option value="Pending Review">Keep Under Review</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0D0D0D] block mb-1">Admin Feedback / Review Notes</label>
                <textarea
                  rows={3}
                  value={workFeedback}
                  onChange={(e) => setWorkFeedback(e.target.value)}
                  placeholder="Enter feedback notes or guidance for the intern..."
                  className="w-full p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              {workReviewSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Deliverable evaluation saved successfully!</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEDED]">
              <button
                type="button"
                onClick={() => setSelectedWorkForReview(null)}
                className="px-3.5 py-2 border border-[#EDEDED] text-xs font-bold rounded-xl text-[#0D0D0D]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWorkReview}
                disabled={submittingWorkReview}
                className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>{submittingWorkReview ? 'Saving Evaluation...' : 'Save Evaluation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
