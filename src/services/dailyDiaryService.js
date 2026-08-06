import { supabase } from '../lib/supabase';

// Helper to format date in Asia/Kolkata timezone (YYYY-MM-DD)
export function getKolkataDateString(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

// Check if a date string matches current server date in Asia/Kolkata
export function isEditableToday(entryDateStr) {
  if (!entryDateStr) return false;
  const todayKolkata = getKolkataDateString();
  return entryDateStr === todayKolkata;
}

/**
 * Fetch intern's daily diary entries ordered by date descending
 */
export async function fetchDailyDiaries(userId) {
  try {
    const { data, error } = await supabase
      .from('daily_diary_entries')
      .select('*')
      .eq('intern_id', userId)
      .order('entry_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data && data.length > 0 ? data.map(mapDiaryFields) : [];
  } catch (err) {
    console.error('[DailyDiaryService] Error fetching daily diaries:', err);
    throw err;
  }
}

/**
 * Save or update today's single plain-text diary using secure RPC save_daily_diary
 */
export async function saveDailyDiary({ diaryText, saveType = 'submitted' }) {
  try {
    const trimmed = (diaryText || '').trim();

    if (trimmed.length < 20) {
      return { success: false, message: 'Daily diary summary must be at least 20 characters.' };
    }
    if (trimmed.length > 3000) {
      return { success: false, message: 'Daily diary summary cannot exceed 3000 characters.' };
    }

    const todayKolkata = getKolkataDateString();
    const statusVal = saveType === 'draft' ? 'draft' : 'submitted';

    // 1. Try RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('save_daily_diary', {
      p_diary_text: trimmed,
      p_save_type: saveType
    });

    if (!rpcError && rpcData) {
      return rpcData;
    }

    console.warn('[DailyDiaryService] RPC save_daily_diary unavailable or unmigrated remotely. Executing direct table upsert fallback:', rpcError?.message);

    // 2. Direct Supabase Table Upsert Fallback (matches exact schema definition)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const userId = userData?.user?.id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Check existing record for today
    const { data: existing, error: existErr } = await supabase
      .from('daily_diary_entries')
      .select('*')
      .eq('intern_id', userId)
      .eq('entry_date', todayKolkata)
      .maybeSingle();
      
    if (existErr) throw existErr;

    if (existing) {
      const { data: updated, error: updateErr } = await supabase
        .from('daily_diary_entries')
        .update({
          work_summary: trimmed,
          status: statusVal,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return {
        success: true,
        diary_id: updated.id,
        status: statusVal,
        diary_date: todayKolkata,
        message: saveType === 'draft' ? "Today's diary draft has been saved." : "Today's diary has been submitted successfully."
      };
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('daily_diary_entries')
        .insert([{
          intern_id: userId,
          entry_date: todayKolkata,
          work_summary: trimmed,
          status: statusVal,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;

      return {
        success: true,
        diary_id: inserted.id,
        status: statusVal,
        diary_date: todayKolkata,
        message: saveType === 'draft' ? "Today's diary draft has been saved." : "Today's diary has been submitted successfully."
      };
    }
  } catch (err) {
    console.error('[DailyDiaryService] Save error:', err);
    throw err;
  }
}

/**
 * Delete today's daily diary using secure RPC delete_daily_diary
 */
export async function deleteDailyDiary(diaryId) {
  try {
    const todayKolkata = getKolkataDateString();

    // 1. Try RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('delete_daily_diary', {
      p_diary_id: diaryId
    });

    if (!rpcError && rpcData) {
      return rpcData;
    }

    console.warn('[DailyDiaryService] RPC delete_daily_diary unavailable or unmigrated remotely. Executing direct table delete fallback:', rpcError?.message);

    // 2. Direct Supabase Table Delete Fallback (matches exact schema definition)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const userId = userData?.user?.id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Fetch target entry to verify date in Asia/Kolkata
    const { data: targetEntry, error: fetchErr } = await supabase
      .from('daily_diary_entries')
      .select('*')
      .eq('id', diaryId)
      .eq('intern_id', userId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (!targetEntry) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: 'Diary entry not found.'
      };
    }

    if (targetEntry.entry_date !== todayKolkata) {
      return {
        success: false,
        code: 'DELETE_NOT_ALLOWED',
        message: "Only today's diary can be deleted. Previous-day entries are permanent records."
      };
    }

    const { error: deleteErr } = await supabase
      .from('daily_diary_entries')
      .delete()
      .eq('id', diaryId);

    if (deleteErr) throw deleteErr;

    return {
      success: true,
      code: 'DELETED',
      message: "Today's daily diary has been deleted."
    };
  } catch (err) {
    console.error('[DailyDiaryService] Delete error:', err);
    throw err;
  }
}

function mapDiaryFields(d) {
  return {
    id: d.id,
    diary_date: d.entry_date,
    diary_text: d.work_summary,
    status: d.status,
    admin_feedback: d.review_note || null,
    submitted_at: d.updated_at || d.created_at,
    created_at: d.created_at
  };
}
