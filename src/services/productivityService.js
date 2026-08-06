import { supabase } from '../lib/supabase';

export async function fetchProductivitySummary(userId) {
  if (!userId) return null;

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [attRes, todoRes, diaryRes, workRes] = await Promise.allSettled([
      supabase.from('attendance_records').select('*').eq('intern_id', userId).limit(50),
      supabase.from('todo_items').select('*').eq('intern_id', userId),
      supabase.from('daily_diary_entries').select('*').eq('intern_id', userId).eq('entry_date', todayStr).maybeSingle(),
      supabase.from('pending_work_items').select('*').eq('assigned_to', userId)
    ]);

    // Check for explicit errors
    if (attRes.status === 'rejected' || (attRes.status === 'fulfilled' && attRes.value.error)) {
      throw attRes.value?.error || attRes.reason || new Error('Failed to fetch attendance');
    }
    if (todoRes.status === 'rejected' || (todoRes.status === 'fulfilled' && todoRes.value.error)) {
      throw todoRes.value?.error || todoRes.reason || new Error('Failed to fetch todos');
    }
    if (diaryRes.status === 'rejected' || (diaryRes.status === 'fulfilled' && diaryRes.value.error)) {
      throw diaryRes.value?.error || diaryRes.reason || new Error('Failed to fetch diary');
    }
    if (workRes.status === 'rejected' || (workRes.status === 'fulfilled' && workRes.value.error)) {
      throw workRes.value?.error || workRes.reason || new Error('Failed to fetch pending works');
    }

    const attList = attRes.value.data || [];
    const todayAtt = attList.find(a => a.marked_at?.startsWith(todayStr)) || null;

    const todos = todoRes.value.data || [];
    const todayDiary = diaryRes.value.data || null;
    const pendingWorks = workRes.value.data || [];

    const completedTodos = todos.filter(t => t.is_completed || t.status === 'completed').length;
    const totalTodos = todos.length;
    const urgentWorkCount = pendingWorks.filter(w => w.status === 'draft' || w.status === 'resubmission_required' || w.status === 'assigned').length;
    const overdueWorkCount = pendingWorks.filter(w => w.status === 'overdue' || (w.due_at && new Date(w.due_at) < new Date() && w.status !== 'approved')).length;

    return {
      todayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
      attendanceStatus: todayAtt ? todayAtt.status : 'not_marked',
      checkInTime: todayAtt?.marked_at ? new Date(todayAtt.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      checkOutTime: null,
      todoCompletedCount: completedTodos,
      todoTotalCount: totalTodos,
      diaryStatus: todayDiary ? todayDiary.status : 'not_submitted',
      pendingWorkCount: urgentWorkCount,
      overdueWorkCount: overdueWorkCount,
      progress: {
        attendanceCompleted: !!todayAtt,
        tasksPlanned: totalTodos,
        tasksCompleted: completedTodos,
        diarySubmitted: !!todayDiary && todayDiary.status !== 'draft',
        workSubmitted: pendingWorks.filter(w => w.status === 'submitted' || w.status === 'approved').length
      }
    };
  } catch (err) {
    console.error('[Productivity:Overview] Query execution failed', {
      message: err.message,
      stack: err.stack
    });
    throw err;
  }
}
