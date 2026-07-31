import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { 
  getActiveQuestionnairesWithQuestions,
  getInternSubmission,
  saveInternQuestionnaireDraft,
  submitInternQuestionnaire
} from '../../../services/questionnaireSubmissionService';
import { 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  HelpCircle, 
  Save,
  AlertCircle,
  Clock,
  RotateCcw
} from 'lucide-react';

export function OnboardingQuestionnaire() {
  const navigate = useNavigate();
  const { user, refreshUserData } = useAuth();

  const [questionnaires, setQuestionnaires] = useState([]);
  const [answers, setAnswers] = useState({}); // { [question_id]: { text: '', options: [] } }
  const [submission, setSubmission] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Load all questionnaires & existing submissions
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        const qList = await getActiveQuestionnairesWithQuestions();
        setQuestionnaires(qList);

        if (qList.length > 0) {
          const firstQ = qList[0];
          const existingData = await getInternSubmission(firstQ.id);
          
          if (existingData) {
            setSubmission(existingData.submission);
            
            // Populate answer state from all answers
            const initialAns = {};
            (existingData.answers || []).forEach(ans => {
              initialAns[ans.question_id] = {
                text: ans.answer_text || '',
                options: Array.isArray(ans.answer_options) ? ans.answer_options : []
              };
            });
            setAnswers(initialAns);
          }
        }
      } catch (err) {
        console.error('Error loading questionnaire data:', err);
        setError(err.message || 'Failed to load questionnaire.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Flatten all active questions from all questionnaires
  const allQuestions = questionnaires.flatMap(q => q.questions || []);

  const handleTextChange = (qId, val) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { text: val, options: [] }
    }));
  };

  const handleSingleChoiceSelect = (qId, optionVal) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { text: '', options: [optionVal] }
    }));
  };

  const handleMultipleChoiceToggle = (qId, optionVal) => {
    setAnswers(prev => {
      const currentOpts = prev[qId]?.options || [];
      const exists = currentOpts.includes(optionVal);
      const updatedOpts = exists 
        ? currentOpts.filter(o => o !== optionVal)
        : [...currentOpts, optionVal];

      return {
        ...prev,
        [qId]: { text: '', options: updatedOpts }
      };
    });
  };

  // Convert state into payload format for a specific questionnaire
  const buildAnswersPayloadForQuestionnaire = (qObj) => {
    const qList = qObj.questions || [];
    return qList.map(q => {
      const userAns = answers[q.id] || { text: '', options: [] };
      const isText = q.question_type === 'text';

      if (isText) {
        return {
          question_id: q.id,
          answer_text: userAns.text.trim() || null,
          answer_options: null
        };
      }

      return {
        question_id: q.id,
        answer_text: null,
        answer_options: userAns.options && userAns.options.length > 0 ? userAns.options : null
      };
    });
  };

  const handleSaveDraft = async () => {
    if (questionnaires.length === 0 || submitting) return;
    try {
      setSavingDraft(true);
      setError(null);

      let lastSub = null;
      for (const qObj of questionnaires) {
        const payload = buildAnswersPayloadForQuestionnaire(qObj);
        lastSub = await saveInternQuestionnaireDraft(qObj.id, payload);
      }
      setSubmission(lastSub);
      setSuccessMsg('Draft saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Draft error:', err);
      setError(err.message || 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (questionnaires.length === 0 || submitting) return;

    setError(null);

    // Front-end Validation across ALL questions
    for (const q of allQuestions) {
      const ans = answers[q.id] || { text: '', options: [] };
      if (q.is_required) {
        if (q.question_type === 'text' && !ans.text.trim()) {
          setError(`Please answer required question: "${q.question_text}"`);
          return;
        }
        if (q.question_type === 'single_choice' && ans.options.length === 0) {
          setError(`Please select an option for required question: "${q.question_text}"`);
          return;
        }
        if (q.question_type === 'multiple_choice' && ans.options.length === 0) {
          setError(`Please select at least one option for required question: "${q.question_text}"`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      for (const qObj of questionnaires) {
        const payload = buildAnswersPayloadForQuestionnaire(qObj);
        await submitInternQuestionnaire(qObj.id, payload);
      }
      
      // Re-fetch submission state
      const updated = await getInternSubmission(questionnaires[0].id);
      if (updated) {
        setSubmission(updated.submission);
      }
      setSuccessMsg('Questionnaire Submitted Successfully');
      console.log('Questionnaire submit result:', updated?.submission || questionnaires);
      
      let refreshedData = null;
      if (refreshUserData) {
        refreshedData = await refreshUserData();
      }
      console.log('Profile after refresh:', refreshedData?.profile);

      setTimeout(() => {
        console.log('Redirecting to Simple LMS Learning');
        navigate('/onboarding/learning', { replace: true });
      }, 1200);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit questionnaire.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-white border border-[#EDEDED] rounded-2xl shadow-sm space-y-3">
        <Loader2 className="h-8 w-8 text-[#FF8A00] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-[#0D0D0D]">Loading Questionnaires...</p>
      </div>
    );
  }

  if (questionnaires.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-white border border-[#EDEDED] rounded-2xl shadow-sm space-y-3">
        <HelpCircle className="h-10 w-10 text-[#9A9A9A] mx-auto" />
        <p className="text-base font-bold text-[#0D0D0D]">No Active Questionnaires Available</p>
        <p className="text-xs text-[#9A9A9A]">Please contact your administrator to configure active questionnaires.</p>
      </div>
    );
  }

  const isSubmitted = submission?.status === 'submitted';
  const isPendingReview = isSubmitted && submission?.review_status === 'pending';
  const isCorrectionRequired = isSubmitted && submission?.review_status === 'correction_required';
  const isApproved = isSubmitted && submission?.review_status === 'approved';
  const isReadOnly = isPendingReview || isApproved;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stepper Header */}
      <div className="bg-[#FFFFFF] border border-[#EDEDED] rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-[#FF3D00] uppercase tracking-wider">Step 2 of 5</span>
            <h1 className="text-xl font-bold text-[#0D0D0D]">Intern Assessment Questionnaire</h1>
            <p className="text-xs text-[#9A9A9A] mt-1">
              Please complete all technical, non-technical, and AI tools assessment sections.
            </p>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 text-[#FF3D00] rounded-full">
            40% Complete
          </span>
        </div>
        <div className="w-full bg-[#EDEDED] h-2 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] h-full w-[40%] transition-all duration-500"></div>
        </div>
      </div>

      {/* Success Banner after submission */}
      {isSubmitted && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-emerald-900">Questionnaire Submitted Successfully</h3>
              <p className="text-xs text-emerald-700 font-medium mt-1">
                Your responses have been saved successfully. Continue to the next onboarding step.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-emerald-200/60 flex justify-end">
            <button
              onClick={async () => {
                if (refreshUserData) {
                  await refreshUserData();
                }
                navigate('/onboarding/learning', { replace: true });
              }}
              className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <span>Continue to Simple LMS Learning</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Message Banners */}
      {error && (
        <div className="p-3.5 bg-[#FF3D00]/10 border border-[#FF3D00]/20 rounded-xl text-xs font-semibold text-[#FF3D00] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form rendering ALL questionnaires grouped by title */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-8">
        {questionnaires.map((qObj) => {
          const qList = qObj.questions || [];
          if (qList.length === 0) return null;

          return (
            <div key={qObj.id} className="space-y-4">
              {/* Category Header */}
              <div className="border-b border-[#EDEDED] pb-2 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                      qObj.category === 'tech' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                      qObj.category === 'non_tech' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                      'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {qObj.category === 'tech' ? 'Technical' : qObj.category === 'non_tech' ? 'Non-Technical' : 'AI Tools'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#0D0D0D] mt-1">{qObj.title}</h2>
                  {qObj.description && (
                    <p className="text-xs text-[#9A9A9A]">{qObj.description}</p>
                  )}
                </div>
              </div>

              {/* Questions list for this questionnaire */}
              <div className="space-y-4">
                {qList.map((q, idx) => {
                  const userAns = answers[q.id] || { text: '', options: [] };
                  return (
                    <div key={q.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-[#FF8A00]">
                          Question {idx + 1}
                        </span>
                        {q.is_required && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#0D0D0D]">{q.question_text}</h3>

                      {/* Text rendering */}
                      {q.question_type === 'text' && (
                        <textarea
                          rows={3}
                          disabled={isReadOnly}
                          value={userAns.text}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          placeholder="Type your response here..."
                          className="w-full p-3 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] disabled:bg-gray-100 disabled:text-gray-600"
                        />
                      )}

                      {/* Single Choice rendering */}
                      {q.question_type === 'single_choice' && Array.isArray(q.options) && (
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt) => {
                            const selected = userAns.options.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleSingleChoiceSelect(q.id, opt)}
                                className={`w-full text-left py-2.5 px-3.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-between ${
                                  selected
                                    ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white border-transparent shadow-sm'
                                    : 'bg-white text-[#0D0D0D] border-[#EDEDED] hover:border-[#FF8A00]'
                                } ${isReadOnly ? 'disabled:opacity-80 cursor-default' : ''}`}
                              >
                                <span>{opt}</span>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  selected ? 'border-white bg-white' : 'border-[#9A9A9A]'
                                }`}>
                                  {selected && <div className="w-2 h-2 rounded-full bg-[#FF3D00]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Multiple Choice rendering */}
                      {q.question_type === 'multiple_choice' && Array.isArray(q.options) && (
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt) => {
                            const selected = userAns.options.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleMultipleChoiceToggle(q.id, opt)}
                                className={`w-full text-left py-2.5 px-3.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-between ${
                                  selected
                                    ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white border-transparent shadow-sm'
                                    : 'bg-white text-[#0D0D0D] border-[#EDEDED] hover:border-[#FF8A00]'
                                } ${isReadOnly ? 'disabled:opacity-80 cursor-default' : ''}`}
                              >
                                <span>{opt}</span>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  selected ? 'border-white bg-white text-[#FF3D00]' : 'border-[#9A9A9A]'
                                }`}>
                                  {selected && <CheckCircle2 className="h-3 w-3 text-[#FF3D00]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Action Controls */}
        {!isReadOnly && (
          <div className="pt-4 border-t border-[#EDEDED] flex flex-col sm:flex-row justify-between items-center gap-3">
            <button
              type="button"
              disabled={savingDraft || submitting}
              onClick={handleSaveDraft}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] text-[#0D0D0D] font-semibold text-xs rounded-xl hover:bg-white flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-[#9A9A9A]" />}
              <span>Save Draft</span>
            </button>

            <button
              type="submit"
              disabled={submitting || savingDraft}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{isCorrectionRequired ? 'Resubmit Questionnaire' : 'Submit Questionnaire'}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
