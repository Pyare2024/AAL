import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { fetchDailyDiaries, saveDailyDiary, deleteDailyDiary, getKolkataDateString } from '../../services/dailyDiaryService';
import { DailyDiaryForm, DailyDiaryHistory } from '../../components/productivity/DiaryComponents';
import { FileText, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { LoadingState } from '../../components/productivity/CommonStates';

export function DailyDiaryPage() {
  const { user } = useAuth();
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDiary, setActiveDiary] = useState(null);
  const [showForm, setShowForm] = useState(true); // Open form by default
  const [feedback, setFeedback] = useState(null);

  const todayStr = getKolkataDateString();
  const todayEntry = diaries.find((d) => d.diary_date === todayStr);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user?.id) throw new Error('Not authenticated');
      
      const list = await fetchDailyDiaries(user.id);
      setDiaries(list || []);

      const existingToday = (list || []).find((d) => d.diary_date === todayStr);
      if (existingToday) {
        setActiveDiary(existingToday);
      }
    } catch (err) {
      console.error('[DailyDiaryPage] Error loading data:', err);
      setError(err.message || 'Failed to load daily diary history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const handleSaveDiary = async (formData) => {
    try {
      setFeedback(null);
      const res = await saveDailyDiary(formData);

      if (res && res.success === false) {
        setFeedback({ type: 'error', message: res.message });
      } else {
        setFeedback({ type: 'success', message: res?.message || 'Diary saved successfully.' });
        loadData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save daily diary.' });
    }
  };

  const handleDeleteDiary = async (diaryId) => {
    try {
      setFeedback(null);
      const res = await deleteDailyDiary(diaryId);

      if (res && res.success === false) {
        setFeedback({ type: 'error', message: res.message });
      } else {
        setFeedback({ type: 'success', message: res?.message || "Today's daily diary has been deleted." });
        setActiveDiary(null);
        loadData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete daily diary.' });
    }
  };

  const handleViewDiary = (diary) => {
    setActiveDiary(diary);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-6"><LoadingState message="Loading Daily Diary..." /></div>;

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-8 bg-[#FFF4F2] border border-[#FFD9D2] rounded-2xl text-center">
        <h3 className="text-lg font-bold text-[#D32F2F]">Error loading diary history</h3>
        <p className="text-sm text-[#737373] mt-2 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-white border border-[#D32F2F] text-[#D32F2F] text-xs font-bold rounded-xl hover:bg-[#FFF4F2] transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wider block">Productivity Module</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">Daily Diary</h1>
          <p className="text-xs text-[#737373] mt-1">Write a simple summary of your internship work for today.</p>
        </div>

        {!showForm && (
          <button
            onClick={() => {
              setActiveDiary(todayEntry || null);
              setShowForm(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Write Today's Diary</span>
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs font-bold ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Single Plain-Text Form / Read-Only View */}
      {showForm && (
        <DailyDiaryForm
          onSubmit={handleSaveDiary}
          onDelete={handleDeleteDiary}
          initialData={activeDiary || todayEntry || null}
          onCancel={() => { setShowForm(false); setActiveDiary(null); }}
        />
      )}

      {/* Daily Diary History Section */}
      <DailyDiaryHistory diaries={diaries} onView={handleViewDiary} onDelete={handleDeleteDiary} />
    </div>
  );
}
