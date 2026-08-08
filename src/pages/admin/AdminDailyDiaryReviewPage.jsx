import React, { useState, useEffect } from 'react';
import { 
  fetchDailyDiariesForAdmin, 
  reviewDailyDiary 
} from '../../services/dailyDiaryService';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Send,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';

export function AdminDailyDiaryReviewPage() {
  const [loading, setLoading] = useState(true);
  const [diaries, setDiaries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal / Review state
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const loadDiaries = async () => {
    setLoading(true);
    try {
      // In production, pass the current admin's allocated problem statement IDs
      const data = await fetchDailyDiariesForAdmin(['ps-1', 'ps-2'], {
        search: searchTerm,
        status: statusFilter
      });
      setDiaries(data);
    } catch (err) {
      console.error('[AdminDailyDiaryPage] Failed to fetch diaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiaries();
  }, [statusFilter]);

  const handleOpenReview = (diary) => {
    setSelectedDiary(diary);
    setFeedbackText(diary.admin_feedback || '');
    setFeedbackSuccess(false);
  };

  const handleSendFeedback = async () => {
    if (!selectedDiary) return;
    setSubmitting(true);
    setFeedbackSuccess(false);
    try {
      const res = await reviewDailyDiary(selectedDiary.id, {
        status: 'Reviewed',
        feedback: feedbackText
      });

      if (res.success) {
        setFeedbackSuccess(true);
        setTimeout(() => {
          setSelectedDiary(null);
          loadDiaries();
        }, 1000);
      }
    } catch (err) {
      console.error('Error submitting diary review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDiaries = diaries.filter(d => {
    const nameMatch = d.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const titleMatch = d.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return nameMatch || titleMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF8A00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF8A00] mb-2">
            <FileText className="h-3.5 w-3.5" />
            <span>Daily Diary Review Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Daily Diary Review</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Review progress logs, tasks completed, and challenges submitted by your assigned interns.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="text"
            placeholder="Search by intern name or entry title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-[#9A9A9A]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-semibold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
          >
            <option value="all">All Review Statuses</option>
            <option value="Submitted">Pending Review</option>
            <option value="Reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      {/* Daily Diaries Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDiaries.map((diary) => (
          <div key={diary.id} className="bg-white border border-[#EDEDED] hover:border-[#FF8A00]/40 rounded-2xl p-5 shadow-sm space-y-4 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#FF3D00]/20">
                    {diary.profiles?.full_name ? diary.profiles.full_name.charAt(0) : 'I'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0D0D0D]">{diary.profiles?.full_name || 'Intern'}</h3>
                    <p className="text-[11px] text-[#9A9A9A]">{diary.problem_statements?.title || 'Problem Statement'}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  diary.status === 'Reviewed' 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                    : 'bg-amber-100 text-amber-700 border-amber-300'
                }`}>
                  {diary.status || 'Submitted'}
                </span>
              </div>

              {/* Entry Details */}
              <div className="bg-[#FAFAFA] border border-[#EDEDED] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#0D0D0D]">{diary.title}</span>
                  <span className="text-[11px] text-[#9A9A9A] flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {diary.date}
                  </span>
                </div>
                <p className="text-xs text-[#4A4A4A] line-clamp-3">
                  <strong className="text-[#0D0D0D]">Key Tasks: </strong>
                  {diary.tasks_completed}
                </p>
                {diary.challenges && (
                  <p className="text-[11px] text-[#9A9A9A] line-clamp-2">
                    <strong className="text-amber-700">Challenges: </strong>
                    {diary.challenges}
                  </p>
                )}
              </div>

              {diary.admin_feedback && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex gap-2 items-start">
                  <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[11px]">Admin Feedback Provided:</span>
                    <span>{diary.admin_feedback}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Review Action Button */}
            <button
              onClick={() => handleOpenReview(diary)}
              className="w-full py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{diary.status === 'Reviewed' ? 'Edit Feedback' : 'Review & Provide Feedback'}</span>
            </button>
          </div>
        ))}

        {filteredDiaries.length === 0 && (
          <div className="col-span-full bg-white border border-[#EDEDED] rounded-2xl p-12 text-center text-[#9A9A9A] text-xs">
            No daily diaries found matching your current filter.
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      {selectedDiary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#0D0D0D]">Review Daily Diary Entry</h3>
                <p className="text-xs text-[#9A9A9A]">Intern: {selectedDiary.profiles?.full_name}</p>
              </div>
              <button 
                onClick={() => setSelectedDiary(null)}
                className="text-[#9A9A9A] hover:text-[#0D0D0D] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#FAFAFA] border border-[#EDEDED] rounded-xl p-4 text-xs space-y-2 max-h-60 overflow-y-auto">
              <p className="font-extrabold text-sm text-[#0D0D0D]">{selectedDiary.title}</p>
              <p><strong className="text-[#0D0D0D]">Date: </strong>{selectedDiary.date}</p>
              <p><strong className="text-[#0D0D0D]">Tasks Completed: </strong>{selectedDiary.tasks_completed}</p>
              {selectedDiary.challenges && <p><strong className="text-amber-700">Challenges: </strong>{selectedDiary.challenges}</p>}
              {selectedDiary.plan_tomorrow && <p><strong className="text-emerald-700">Plan for Tomorrow: </strong>{selectedDiary.plan_tomorrow}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0D0D0D] block">
                Admin Feedback / Guidance (Visible to Intern)
              </label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Enter encouragement, performance feedback, or technical suggestions..."
                className="w-full p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
              />
            </div>

            {feedbackSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Feedback submitted successfully!</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDiary(null)}
                className="px-4 py-2 border border-[#EDEDED] text-[#0D0D0D] rounded-xl text-xs font-bold hover:bg-[#F7F7F7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendFeedback}
                disabled={submitting}
                className="px-5 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
