import { supabase } from '../lib/supabase';

/**
 * Service for Intern Questionnaire Submissions and Super Admin Review Operations.
 */

// 1. Fetch active questionnaires with active questions for intern
export async function getActiveQuestionnairesWithQuestions() {
  const { data: questionnaires, error: qErr } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('is_active', true);

  if (qErr) throw qErr;
  if (!questionnaires || questionnaires.length === 0) {
    return [];
  }

  // Sort questionnaires strictly by category order: tech, non_tech, ai_tools
  const categoryOrder = { tech: 1, non_tech: 2, ai_tools: 3 };
  questionnaires.sort((a, b) => {
    const orderA = categoryOrder[a.category] || 99;
    const orderB = categoryOrder[b.category] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(a.created_at) - new Date(b.created_at);
  });

  const qIds = questionnaires.map(q => q.id);

  const { data: questions, error: qstErr } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .in('questionnaire_id', qIds)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (qstErr) throw qstErr;

  const questionMap = {};
  (questions || []).forEach(q => {
    if (!questionMap[q.questionnaire_id]) questionMap[q.questionnaire_id] = [];
    questionMap[q.questionnaire_id].push(q);
  });

  return questionnaires.map(q => ({
    ...q,
    questions: questionMap[q.id] || []
  }));
}

// 2. Fetch existing submissions & answers for all active questionnaires for intern
export async function getInternSubmission(questionnaireId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: submissions, error: subErr } = await supabase
    .from('questionnaire_submissions')
    .select('*')
    .eq('intern_id', user.id);

  if (subErr) throw subErr;
  if (!submissions || submissions.length === 0) return null;

  // Use target questionnaire submission or latest submission
  const targetSub = questionnaireId ? submissions.find(s => s.questionnaire_id === questionnaireId) || submissions[0] : submissions[0];

  const subIds = submissions.map(s => s.id);
  const { data: answers, error: ansErr } = await supabase
    .from('questionnaire_answers')
    .select('*')
    .in('submission_id', subIds);

  if (ansErr) throw ansErr;

  return {
    submission: targetSub,
    submissions,
    answers: answers || []
  };
}

// 3. Save Draft submission
export async function saveInternQuestionnaireDraft(questionnaireId, answersArray) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated user session');

  // Upsert submission as draft
  const { data: submission, error: subErr } = await supabase
    .from('questionnaire_submissions')
    .upsert(
      {
        intern_id: user.id,
        questionnaire_id: questionnaireId,
        status: 'draft',
        review_status: 'pending',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'intern_id,questionnaire_id' }
    )
    .select()
    .single();

  if (subErr) throw subErr;

  // Upsert answers
  if (answersArray && answersArray.length > 0) {
    const formattedAnswers = answersArray.map(a => ({
      submission_id: submission.id,
      question_id: a.question_id,
      answer_text: a.answer_text || null,
      answer_options: a.answer_options || null,
      updated_at: new Date().toISOString()
    }));

    const { error: ansErr } = await supabase
      .from('questionnaire_answers')
      .upsert(formattedAnswers, { onConflict: 'submission_id,question_id' });

    if (ansErr) throw ansErr;
  }

  return submission;
}

// 4. Submit Final Questionnaire via RPC
export async function submitInternQuestionnaire(questionnaireId, answersArray) {
  const { data, error } = await supabase.rpc('submit_intern_questionnaire', {
    p_questionnaire_id: questionnaireId,
    p_answers: answersArray
  });

  if (error) throw error;
  return data;
}

// 5. Fetch all questionnaire submissions for Super Admin Assessment Queue
export async function fetchAllQuestionnaireSubmissions() {
  const { data: submissions, error: subErr } = await supabase
    .from('questionnaire_submissions')
    .select(`
      *,
      questionnaires (id, title, category),
      profiles:intern_id (id, full_name, email, college_name, city, onboarding_status)
    `)
    .order('updated_at', { ascending: false });

  if (subErr) throw subErr;
  return submissions || [];
}

// 6. Fetch submission details with questions and answers for Super Admin review
export async function fetchSubmissionDetailsForReview(submissionId) {
  const { data: submission, error: subErr } = await supabase
    .from('questionnaire_submissions')
    .select(`
      *,
      questionnaires (id, title, description, category),
      profiles:intern_id (id, full_name, email, college_name, city, onboarding_status)
    `)
    .eq('id', submissionId)
    .single();

  if (subErr) throw subErr;

  const { data: questions, error: qstErr } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .eq('questionnaire_id', submission.questionnaire_id)
    .order('display_order', { ascending: true });

  if (qstErr) throw qstErr;

  const { data: answers, error: ansErr } = await supabase
    .from('questionnaire_answers')
    .select('*')
    .eq('submission_id', submissionId);

  if (ansErr) throw ansErr;

  const answerMap = {};
  (answers || []).forEach(a => {
    answerMap[a.question_id] = a;
  });

  const questionDetails = (questions || []).map(q => ({
    ...q,
    answer: answerMap[q.id] || null
  }));

  return {
    submission,
    questions: questionDetails
  };
}

// 7. Super Admin Review RPC call
export async function reviewQuestionnaireSubmission(submissionId, decision, comment = '') {
  const { data, error } = await supabase.rpc('review_questionnaire_submission', {
    p_submission_id: submissionId,
    p_decision: decision,
    p_comment: comment
  });

  if (error) throw error;
  return data;
}
