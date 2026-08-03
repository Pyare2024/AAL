import { supabase } from '../lib/supabase';

/**
 * Service encapsulating Intern Dashboard summary aggregation RPC
 */
export async function fetchInternDashboardSummary() {
  const { data, error } = await supabase.rpc('get_intern_dashboard_summary');

  if (error) {
    console.error('Error executing get_intern_dashboard_summary RPC:', error);
    throw error;
  }

  return data || {};
}

/**
 * Lazy query helper to fetch optional feature previews (Diary today status, LMS progress, Onboarding step status)
 */
export async function fetchInternDashboardLazyDetails(userId) {
  if (!userId) return {};

  const todayStr = new Date().toISOString().split('T')[0];

  const [diaryRes, learningRes, onboardingRes, interviewRes] = await Promise.allSettled([
    // 1. Daily Diary Today Status
    supabase
      .from('daily_diary_entries')
      .select('id, status, entry_date, updated_at')
      .eq('intern_id', userId)
      .order('entry_date', { ascending: false })
      .limit(5),

    // 2. LMS Progress Summary
    supabase
      .from('learning_progress')
      .select('id, status, progress_percentage')
      .eq('intern_id', userId),

    // 3. Onboarding Progress Steps
    supabase
      .from('onboarding_progress')
      .select('profile_completed, questionnaire_completed, learning_intro_completed, activities_completed, interview_completed, problem_statement_allocated, completion_percentage')
      .eq('intern_id', userId)
      .maybeSingle(),

    // 4. Upcoming Interview Event
    supabase
      .from('interviews')
      .select('id, scheduled_at, meeting_link, status')
      .eq('intern_id', userId)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
  ]);

  const diaryEntries = diaryRes.status === 'fulfilled' && !diaryRes.value.error ? diaryRes.value.data : [];
  const todayDiary = diaryEntries.find(e => e.entry_date === todayStr);
  const lastDiary = diaryEntries[0];

  const learningList = learningRes.status === 'fulfilled' && !learningRes.value.error ? learningRes.value.data : [];
  const totalAssignedModules = learningList.length;
  const completedModules = learningList.filter(l => l.status === 'completed' || l.progress_percentage === 100).length;
  const inProgressModules = learningList.filter(l => l.status === 'in_progress' || (l.progress_percentage > 0 && l.progress_percentage < 100)).length;
  const lmsAveragePercent = totalAssignedModules > 0
    ? Math.round(learningList.reduce((acc, curr) => acc + (curr.progress_percentage || 0), 0) / totalAssignedModules)
    : 0;

  const onboardingData = onboardingRes.status === 'fulfilled' && !onboardingRes.value.error ? onboardingRes.value.data : null;
  const upcomingInterview = interviewRes.status === 'fulfilled' && !interviewRes.value.error && interviewRes.value.data?.length ? interviewRes.value.data[0] : null;

  return {
    diary: {
      todayStatus: todayDiary ? todayDiary.status : 'pending',
      submittedToday: !!todayDiary,
      lastSubmittedDate: lastDiary ? lastDiary.entry_date : null,
    },
    learning: {
      totalAssigned: totalAssignedModules,
      completed: completedModules,
      inProgress: inProgressModules,
      percentage: lmsAveragePercent,
    },
    onboarding: onboardingData || null,
    upcomingInterview: upcomingInterview || null,
  };
}

