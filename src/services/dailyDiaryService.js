import { supabase } from '../lib/supabase';

/**
 * Get date string formatted in IST / Kolkata timezone (YYYY-MM-DD)
 */
export function getKolkataDateString(date = new Date()) {
  const d = new Date(date);
  const offset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + offset);
  return istDate.toISOString().split('T')[0];
}

/**
 * Check if diary entry is editable today
 */
export function isEditableToday(diaryDate) {
  const today = getKolkataDateString();
  return diaryDate === today;
}

/**
 * Fetch daily diaries for current intern user
 */
export async function fetchDailyDiaries(userId) {
  try {
    const { data, error } = await supabase
      .from('daily_diaries')
      .select('*')
      .order('diary_date', { ascending: false });

    if (error) {
      console.warn('[DailyDiaryService] Query notice:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[DailyDiaryService] Error fetching intern diaries:', err);
    return [];
  }
}

/**
 * Save / Create / Update Intern Daily Diary
 */
export async function saveDailyDiary(diaryData) {
  try {
    const todayStr = getKolkataDateString();
    const payload = {
      diary_date: diaryData.diary_date || todayStr,
      title: diaryData.title || '',
      tasks_completed: diaryData.tasks_completed || '',
      challenges: diaryData.challenges || '',
      plan_tomorrow: diaryData.plan_tomorrow || '',
      status: diaryData.status || 'Submitted'
    };

    if (diaryData.id) {
      const { data, error } = await supabase
        .from('daily_diaries')
        .update(payload)
        .eq('id', diaryData.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('daily_diaries')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  } catch (err) {
    console.error('[DailyDiaryService] Error saving diary:', err);
    return { success: false, message: err.message || 'Failed to save daily diary.' };
  }
}

/**
 * Delete intern daily diary entry
 */
export async function deleteDailyDiary(id) {
  try {
    const { error } = await supabase
      .from('daily_diaries')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Fetch daily diaries for Super Admin (Platform-wide)
 */
export async function fetchDailyDiariesForSuperAdmin(filters = {}) {
  try {
    let query = supabase
      .from('daily_diaries')
      .select(`
        *,
        profiles:user_id (id, full_name, email, avatar_url),
        problem_statements:problem_statement_id (id, title)
      `)
      .order('diary_date', { ascending: false });

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[DailyDiaryService] Database query notice:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[DailyDiaryService] Error fetching super admin diaries:', err);
    return [];
  }
}

/**
 * Fetch daily diaries for Admin (Filtered by allocated problem statement IDs)
 */
export async function fetchDailyDiariesForAdmin(problemStatementIds = [], filters = {}) {
  try {
    if (!problemStatementIds || problemStatementIds.length === 0) {
      return [];
    }

    let query = supabase
      .from('daily_diaries')
      .select(`
        *,
        profiles:user_id (id, full_name, email, avatar_url),
        problem_statements:problem_statement_id (id, title)
      `)
      .in('problem_statement_id', problemStatementIds)
      .order('diary_date', { ascending: false });

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[DailyDiaryService] Admin query notice:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[DailyDiaryService] Error fetching admin diaries:', err);
    return [];
  }
}

/**
 * Review / Add feedback to an intern's daily diary (Admin & Super Admin)
 */
export async function reviewDailyDiary(diaryId, reviewData = {}) {
  try {
    const { data, error } = await supabase
      .from('daily_diaries')
      .update({
        status: reviewData.status || 'Reviewed',
        admin_feedback: reviewData.feedback || '',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', diaryId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[DailyDiaryService] Error reviewing diary:', err);
    return { success: false, message: err.message || 'Failed to review diary' };
  }
}
