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
  AlertCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export function AdminDailyDiaryReviewPage() {
  const [loading, setLoading] = useState(true);
  const [diaries, setDiaries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal / Review state
  const [selectedStudentDiaries, setSelectedStudentDiaries] = useState(null);
  const [selectedDiaryForFeedback, setSelectedDiaryForFeedback] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const loadDiaries = async () => {
    setLoading(true);
    try {
      const data = await fetchDailyDiariesForAdmin(['ps-1', 'ps-2'], {
        search: searchTerm,
        status: statusFilter
      });
      setDiaries(data);
    } catch (err) {
      console.error('[AdminDailyDiaryPage] Failed to fetch diaries:', err);
      setDiaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiaries();
  }, [statusFilter]);

  // Group Diaries by Student
  const studentGroups = diaries.reduce((acc, diary) => {
    const studentName = diary.profiles?.full_name || diary.internName || 'Intern User';
    const email = diary.profiles?.email || diary.email || 'intern@asg.com';
    const ps = diary.problem_statements?.title || diary.problemStatement || 'Allocated Problem Statement';

    if (!acc[email]) {
      acc[email] = {
        internName: studentName,
        email: email,
        problemStatement: ps,
        diaries: []
      };
    }
    acc[email].diaries.push(diary);
    return acc;
  }, {});

  const studentList = Object.values(studentGroups).filter(student => {
    const matchesSearch = 
      student.internName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleOpenStudentDiaries = (student) => {
    setSelectedStudentDiaries(student);
    setSelectedDiaryForFeedback(null);
    setFeedbackSuccess(false);
  };

  const handleOpenFeedbackForm = (diary) => {
    setSelectedDiaryForFeedback(diary);
    setFeedbackText(diary.admin_feedback || '');
    setFeedbackSuccess(false);
  };

  const handleSendFeedback = async () => {
    if (!selectedDiaryForFeedback) return;
    setSubmitting(true);
    setFeedbackSuccess(false);
    try {
      const res = await reviewDailyDiary(selectedDiaryForFeedback.id, {
        status: 'Reviewed',
        feedback: feedbackText
      });

      if (res.success) {
        setFeedbackSuccess(true);
        setTimeout(() => {
          setSelectedDiaryForFeedback(null);
          loadDiaries();
        }, 1000);
      }
    } catch (err) {
      console.error('Error submitting diary review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF8A00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF8A00] mb-2">
            <FileText className="h-3.5 w-3.5" />
            <span>Admin Review Scope</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Allocated Intern Daily Diaries</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Select a student to view their daily progress diaries and provide guidance feedback.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="text"
            placeholder="Search intern by name or email..."
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
            <option value="Submitted">Pending Review</option>
            <option value="Reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studentList.map((student) => (
          <div 
            key={student.email} 
            onClick={() => handleOpenStudentDiaries(student)}
            className="p-5 bg-white border border-[#EDEDED] hover:border-[#FF8A00] rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md space-y-3 group"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                  {student.internName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0D0D0D] group-hover:text-[#FF8A00] transition-colors">
                    {student.internName}
                  </h4>
                  <p className="text-xs text-[#9A9A9A]">{student.email}</p>
                </div>
              </div>

              <span className="px-2.5 py-1 bg-[#F7F7F7] border border-[#EDEDED] text-[#0D0D0D] font-extrabold text-[11px] rounded-lg">
                {student.diaries.length} Submissions
              </span>
            </div>

            <div className="p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs space-y-1">
              <p className="text-[#9A9A9A]">Problem Statement: <strong className="text-[#0D0D0D]">{student.problemStatement}</strong></p>
              <p className="text-[#9A9A9A]">Latest Topic: <strong className="text-[#FF8A00]">{student.diaries[0]?.title}</strong></p>
            </div>

            <div className="flex justify-between items-center pt-1 text-xs font-bold text-[#FF8A00] group-hover:translate-x-1 transition-transform">
              <span>View Daily Diaries Timeline</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        ))}

        {studentList.length === 0 && (
          <div className="col-span-2 p-8 bg-white border border-[#EDEDED] rounded-2xl text-center text-[#9A9A9A] text-xs">
            No daily diary submissions found for your assigned interns.
          </div>
        )}
      </div>

      {/* STUDENT DIARY TIMELINE MODAL */}
      {selectedStudentDiaries && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-extrabold text-lg text-[#0D0D0D]">
                  Daily Diaries — {selectedStudentDiaries.internName}
                </h3>
                <p className="text-xs text-[#9A9A9A]">{selectedStudentDiaries.email} | {selectedStudentDiaries.problemStatement}</p>
              </div>
              <button 
                onClick={() => setSelectedStudentDiaries(null)}
                className="text-[#9A9A9A] hover:text-[#0D0D0D] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Submissions List */}
            <div className="space-y-4">
              {selectedStudentDiaries.diaries.map((diary, idx) => (
                <div key={diary.id ? `${diary.id}-${idx}` : `diary-idx-${idx}`} className="p-5 bg-[#FAFAFA] border border-[#EDEDED] rounded-2xl space-y-3 shadow-xs">
                  <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
                    <h4 className="text-sm font-extrabold text-[#0D0D0D] flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#FF8A00]" />
                      <span>{diary.title}</span>
                    </h4>
                    <span className="text-xs font-semibold text-[#9A9A9A] px-2.5 py-0.5 bg-white border border-[#EDEDED] rounded-md">
                      Date: {diary.diary_date || diary.date}
                    </span>
                  </div>

                  <div className="text-xs space-y-2 text-[#4A4A4A]">
                    <p><strong className="text-[#0D0D0D]">Submitted Summary / Work Done: </strong>{diary.diary_text || diary.tasks_completed || diary.summary || diary.title}</p>
                    {diary.challenges && <p><strong className="text-amber-700">Challenges / Blockers: </strong>{diary.challenges}</p>}
                    {diary.plan_tomorrow && <p><strong className="text-[#0D0D0D]">Plan for Tomorrow: </strong>{diary.plan_tomorrow}</p>}
                  </div>

                  {diary.admin_feedback && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl">
                      <strong>Admin Feedback: </strong>{diary.admin_feedback}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleOpenFeedbackForm(diary)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{diary.admin_feedback ? 'Edit Feedback' : 'Add Admin Feedback'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback Submission Modal Inside Drawer */}
            {selectedDiaryForFeedback && (
              <div className="mt-4 p-4 bg-white border border-[#FF8A00]/40 rounded-2xl shadow-md space-y-3">
                <h4 className="text-xs font-bold text-[#0D0D0D]">
                  Enter Feedback for "{selectedDiaryForFeedback.title}"
                </h4>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter guidance or review feedback..."
                  className="w-full p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />

                {feedbackSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Feedback submitted successfully!</span>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDiaryForFeedback(null)}
                    className="px-3 py-1.5 border border-[#EDEDED] text-xs font-bold rounded-xl text-[#0D0D0D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendFeedback}
                    disabled={submitting}
                    className="px-4 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
