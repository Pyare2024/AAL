import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  fetchBroadcastTaskAssignments, 
  submitPendingWork,
  fetchPendingWorkForSuperAdmin 
} from '../../services/pendingWorkService';
import { 
  Clock, 
  Send, 
  ExternalLink, 
  FolderPlus, 
  Megaphone, 
  CheckCircle2, 
  Sparkles,
  FileText,
  Star
} from 'lucide-react';

export function PendingWorkPage() {
  const [taskAssignments, setTaskAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedTaskTitle, setSelectedTaskTitle] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [assignments, submissions] = await Promise.all([
        fetchBroadcastTaskAssignments(),
        fetchPendingWorkForSuperAdmin()
      ]);
      setTaskAssignments(assignments);
      setMySubmissions(submissions);

      if (assignments.length > 0 && !selectedTaskTitle) {
        setSelectedTaskTitle(assignments[0].task_title);
      }
    } catch (err) {
      console.error('[PendingWorkPage] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!deliverableUrl.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg(false);

    try {
      const res = await submitPendingWork({
        task_title: selectedTaskTitle || 'GitHub Seven-Step Activity Assignment',
        deliverable_url: deliverableUrl.trim(),
        submission_notes: submissionNotes.trim()
      });

      if (res.success) {
        setSuccessMsg(true);
        setDeliverableUrl('');
        setSubmissionNotes('');
        setTimeout(() => {
          setSuccessMsg(false);
          loadData();
        }, 1200);
      }
    } catch (err) {
      console.error('Error submitting work:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-[#FF8A00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 sm:p-4">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF8A00] uppercase tracking-wider block mb-1">Productivity Module</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">Pending Work & Task Submissions</h1>
          <p className="text-xs text-[#737373] mt-1">Review Super Admin task assignments, upload deliverables to Google Drive, and submit GitHub links.</p>
        </div>
      </div>

      {/* Super Admin Broadcasted Task Assignments Section */}
      {taskAssignments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
            <Megaphone className="h-4 w-4 text-[#FF8A00]" />
            <span>Super Admin Task Assignments & Drive Folders</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taskAssignments.map((task, idx) => (
              <div key={task.id ? `${task.id}-${idx}` : `task-${idx}`} className="p-5 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-extrabold text-[#171717]">{task.task_title}</h3>
                  <span className="text-[10px] font-bold text-[#FF8A00] bg-white border border-orange-200 px-2.5 py-0.5 rounded-full">
                    Due: {task.due_date}
                  </span>
                </div>

                <p className="text-xs text-[#4A4A4A] leading-relaxed">{task.message_instructions}</p>

                {task.common_drive_url && (
                  <div className="pt-2">
                    <a
                      href={task.common_drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-extrabold rounded-xl shadow-sm hover:opacity-95 transition-all"
                    >
                      <FolderPlus className="h-4 w-4" />
                      <span>Open Common Google Drive Folder</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deliverable Submission Form */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-[#171717] flex items-center gap-2">
          <Send className="h-4 w-4 text-[#FF8A00]" />
          <span>Submit Deliverable (GitHub Repository / Google Drive Link)</span>
        </h2>

        <form onSubmit={handleSubmitDeliverable} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-[#171717] block mb-1">Select Task Assignment *</label>
            <select
              value={selectedTaskTitle}
              onChange={(e) => setSelectedTaskTitle(e.target.value)}
              className="w-full p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#171717] focus:outline-none focus:border-[#FF8A00]"
            >
              {taskAssignments.map((task) => (
                <option key={task.id} value={task.task_title}>
                  {task.task_title}
                </option>
              ))}
              <option value="GitHub Seven-Step Activity Assignment">GitHub Seven-Step Activity Assignment</option>
              <option value="Custom Project Deliverable">Custom Project Deliverable</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-[#171717] block mb-1">Deliverable URL (GitHub Repo / Google Drive Link) *</label>
            <input
              type="url"
              required
              value={deliverableUrl}
              onChange={(e) => setDeliverableUrl(e.target.value)}
              placeholder="https://github.com/username/repository or https://drive.google.com/..."
              className="w-full p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#FF8A00]"
            />
          </div>

          <div>
            <label className="font-bold text-[#171717] block mb-1">Submission Notes & Highlights</label>
            <textarea
              rows={3}
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder="Describe your completed work, features integrated, or Drive folder structure..."
              className="w-full p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#FF8A00]"
            />
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Deliverable submitted successfully for Super Admin & Admin review!</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-extrabold rounded-xl shadow-md hover:opacity-95 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Deliverable'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Submitted Deliverables Status Section */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-[#171717] flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#FF8A00]" />
          <span>My Submitted Deliverables History</span>
        </h2>

        <div className="space-y-3">
          {mySubmissions.map((sub, idx) => (
            <div key={sub.id ? `${sub.id}-${idx}` : `sub-${idx}`} className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#171717]">{sub.task_title}</h4>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    sub.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-blue-100 text-blue-800 border-blue-300'
                  }`}>
                    {sub.status}
                  </span>
                  {sub.grade && (
                    <span className="text-[10px] font-black px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded-md flex items-center gap-1">
                      <Star className="h-3 w-3 fill-purple-600 text-purple-600" /> Grade: {sub.grade}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#737373]">{sub.submission_notes}</p>
                {sub.admin_feedback && (
                  <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg mt-1">
                    <strong>Admin Feedback: </strong>{sub.admin_feedback}
                  </p>
                )}
              </div>

              {sub.deliverable_url && (
                <a
                  href={sub.deliverable_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white border border-[#EDEDED] hover:border-[#FF8A00] text-xs font-bold rounded-xl text-[#171717] flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#FF8A00]" />
                  <span>View Link</span>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
