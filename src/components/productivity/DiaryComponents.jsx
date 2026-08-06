import React, { useState, useEffect } from 'react';
import { isEditableToday, getKolkataDateString } from '../../services/dailyDiaryService';
import { 
  Lock, 
  Clock, 
  AlertCircle, 
  FileText, 
  Save, 
  Send,
  Calendar,
  Trash2,
  CheckCircle2
} from 'lucide-react';

/**
 * Single Plain-Text Daily Diary Form Component
 * - Single large textarea (min 20 chars, max 3000 chars, min-h-[250px])
 * - Live character counter (0 / 3000)
 * - Save Draft & Submit Diary buttons
 * - Read-only mode for previous-day entries
 */
export function DailyDiaryForm({ onSubmit, onDelete, initialData = null, onCancel }) {
  const targetDate = initialData?.diary_date || getKolkataDateString();
  const isToday = isEditableToday(targetDate);

  const [diaryText, setDiaryText] = useState(initialData?.diary_text || '');
  const [errorMsg, setErrorMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const charCount = diaryText.length;
  const trimmedLength = diaryText.trim().length;

  // Midnight check interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isEditableToday(targetDate)) {
        setErrorMsg('Editing time has ended because this diary belongs to the previous day.');
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const handleAction = async (saveType) => {
    setErrorMsg(null);

    // Midnight Check: Verify today's server date
    if (!isEditableToday(targetDate)) {
      setErrorMsg('This diary is no longer editable because the date has changed.');
      setShowConfirmModal(false);
      return;
    }

    if (trimmedLength < 20) {
      setErrorMsg('Daily diary summary must be at least 20 characters.');
      setShowConfirmModal(false);
      return;
    }

    if (charCount > 3000) {
      setErrorMsg('Daily diary summary cannot exceed 3000 characters.');
      setShowConfirmModal(false);
      return;
    }

    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      await onSubmit({
        diaryText: diaryText.trim(),
        saveType
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save diary.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!initialData?.id || !onDelete) return;
    setShowDeleteModal(false);
    setSubmitting(true);
    await onDelete(initialData.id);
    setSubmitting(false);
  };

  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#EDEDED]">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
            isToday ? 'bg-orange-50 text-[#FF8A00] border border-orange-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}>
            {isToday ? <FileText className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#171717]">Daily Diary</h3>
            <p className="text-xs text-[#737373] mt-0.5">
              {isToday ? 'Write a simple summary of your internship work for today.' : 'This diary is from a previous day and can no longer be edited.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Read-Only Date Badge */}
          <div className="px-3 py-1.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#171717] flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#FF8A00]" />
            <span>Date: {targetDate}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
            isToday 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-gray-100 border-gray-200 text-gray-600'
          }`}>
            {isToday ? <Clock className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4" />}
            <span>{isToday ? 'Editable Today' : 'Read Only'}</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Field */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <label className="font-bold text-[#171717] block">Today’s Daily Diary *</label>
          <span className={`text-[11px] font-mono font-semibold ${charCount > 3000 ? 'text-red-600' : 'text-[#737373]'}`}>
            {charCount} / 3000
          </span>
        </div>

        <textarea
          disabled={!isToday || submitting}
          value={diaryText}
          onChange={(e) => setDiaryText(e.target.value)}
          placeholder="Write what you completed today, what you learned, any issue you faced, and your next plan..."
          className={`w-full p-4 rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none min-h-[250px] leading-relaxed ${
            isToday 
              ? 'bg-[#FAFAFA] border border-[#EDEDED] text-[#171717]' 
              : 'bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          rows={10}
          required
        />
        {trimmedLength > 0 && trimmedLength < 20 && (
          <p className="text-[11px] font-semibold text-amber-700">Minimum 20 characters required ({20 - trimmedLength} more needed).</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#EDEDED]">
        <div>
          {isToday && initialData?.id && onDelete && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowDeleteModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Today's Diary</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 font-bold text-xs text-[#737373] hover:text-[#171717]"
            >
              Close
            </button>
          )}

          {isToday && (
            <>
              <button
                type="button"
                disabled={submitting || trimmedLength < 20}
                onClick={() => handleAction('draft')}
                className="px-4 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] hover:bg-gray-100 text-[#171717] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                disabled={submitting || trimmedLength < 20}
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>Submit Diary</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EDEDED] shadow-xl p-6 w-full max-w-md space-y-4">
            <h4 className="text-base font-bold text-[#171717]">Delete Today's Diary?</h4>
            <p className="text-xs text-[#737373]">
              This action will permanently remove today's diary. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#171717]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EDEDED] shadow-xl p-6 w-full max-w-md space-y-4">
            <h4 className="text-base font-bold text-[#171717]">Submit Today's Diary?</h4>
            <p className="text-xs text-[#737373]">
              Are you sure you want to submit today's daily diary entry? You can still edit your entry until today (Asia/Kolkata) ends.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#171717]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction('submitted')}
                className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Daily Diary History Section Component
 */
export function DailyDiaryHistory({ diaries = [], onView, onDelete }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[#171717]">Daily Diary History</h3>
      {diaries.length === 0 ? (
        <div className="p-8 bg-white border border-[#EDEDED] rounded-2xl text-center">
          <p className="text-xs text-[#737373]">No daily diary entries logged yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {diaries.map((diary) => (
            <DailyDiaryHistoryCard key={diary.id} diary={diary} onView={onView} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Daily Diary History Card
 */
export function DailyDiaryHistoryCard({ diary, onView, onDelete }) {
  const isToday = isEditableToday(diary.diary_date);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <div className="p-5 bg-white border border-[#EDEDED] rounded-2xl shadow-sm space-y-3 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between border-b border-[#EDEDED] pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#FF8A00]" />
          <div>
            <span className="text-[10px] font-bold text-[#737373] uppercase block">Date</span>
            <h4 className="text-sm font-bold text-[#171717]">{diary.diary_date}</h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DiaryStatusBadge status={diary.status} isToday={isToday} />

          <button
            onClick={() => onView(diary)}
            className="text-xs font-bold text-[#FF8A00] hover:underline pl-2"
          >
            {isToday ? 'Edit' : 'View'}
          </button>

          {isToday && onDelete && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="text-xs font-bold text-red-600 hover:underline pl-2"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="text-xs">
        <span className="font-bold text-[#737373] block uppercase text-[10px] mb-1">Diary Summary</span>
        <p className="text-[#171717] font-medium leading-relaxed line-clamp-3 whitespace-pre-line">
          {diary.diary_text}
        </p>
      </div>

      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EDEDED] shadow-xl p-6 w-full max-w-md space-y-4">
            <h4 className="text-base font-bold text-[#171717]">Delete Today's Diary?</h4>
            <p className="text-xs text-[#737373]">
              This action will permanently remove today's diary. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#171717]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmDelete(false);
                  onDelete(diary.id);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Status & Editable Badge
 */
export function DiaryStatusBadge({ status, isToday }) {
  if (isToday) {
    return (
      <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Editable Today
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 text-[11px] font-bold bg-gray-100 border border-gray-200 text-gray-600 rounded-full flex items-center gap-1" title="This diary is a historical record and cannot be edited.">
      <Lock className="h-3 w-3" />
      Read Only
    </span>
  );
}
