import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useOnboardingInterns } from '../../hooks/useOnboardingInterns';
import { ManagementFilterBar } from '../../components/common/ManagementFilterBar';
import { 
  fetchAllQuestionnaireSubmissions,
  fetchSubmissionDetailsForReview,
  reviewQuestionnaireSubmission
} from '../../services/questionnaireSubmissionService';
import { 
  ClipboardList, 
  Plus, 
  Edit3, 
  Trash2, 
  Power, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ListChecks, 
  FileText, 
  AlertCircle, 
  ChevronUp, 
  ChevronDown,
  Layers,
  Users,
  Search,
  Sparkles,
  HelpCircle,
  Check,
  X
} from 'lucide-react';

export function QuestionnaireManagementPage() {
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'queue'
  
  // Data state for Builder
  const [questionnaires, setQuestionnaires] = useState([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Data state for Assessment Queue
  const [dbSubmissions, setDbSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [queueReviewFilter, setQueueReviewFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'correction_required'

  // Review Dialog State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSubmissionData, setReviewSubmissionData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewActionType, setReviewActionType] = useState('approve'); // 'approve' | 'correction'
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Form states for Questionnaire modal / inline editor
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState(null); // null for create, object for edit
  const [qTitle, setQTitle] = useState('');
  const [qDescription, setQDescription] = useState('');
  const [qCategory, setQCategory] = useState('tech');
  const [qIsActive, setQIsActive] = useState(true);
  const [savingQuestionnaire, setSavingQuestionnaire] = useState(false);

  // Form states for Question modal / inline editor
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('text'); // 'text' | 'single_choice' | 'multiple_choice'
  const [qOptions, setQOptions] = useState(['', '']);
  const [qIsRequired, setQIsRequired] = useState(true);

  // Assessment Queue Filter Bar State
  const initialFilters = {
    search: '',
    problemStatement: 'all',
    college: 'all',
    city: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  };
  const [filters, setFilters] = useState(initialFilters);

  // Fetch Assessment Queue Submissions
  const loadQueueSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const subs = await fetchAllQuestionnaireSubmissions();
      setDbSubmissions(subs);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'queue') {
      loadQueueSubmissions();
    }
  }, [activeTab]);

  const handleOpenReviewDialog = async (submissionId) => {
    try {
      setReviewLoading(true);
      setShowReviewModal(true);
      setReviewComment('');
      setReviewActionType('approve');
      const details = await fetchSubmissionDetailsForReview(submissionId);
      setReviewSubmissionData(details);
    } catch (err) {
      console.error('Error loading review details:', err);
      setError(err.message);
      setShowReviewModal(false);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleExecuteReview = async (decision) => {
    if (!reviewSubmissionData?.submission) return;
    const subId = reviewSubmissionData.submission.id;

    if (decision === 'correction_required' && !reviewComment.trim()) {
      alert('A review comment is mandatory when requesting corrections.');
      return;
    }

    try {
      setReviewSubmitting(true);
      await reviewQuestionnaireSubmission(subId, decision, reviewComment.trim());
      showTempSuccess(`Submission successfully ${decision === 'approved' ? 'approved' : 'marked for correction'}.`);
      setShowReviewModal(false);
      loadQueueSubmissions();
    } catch (err) {
      console.error('Review submit error:', err);
      alert(err.message || 'Failed to process review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const filteredDbSubmissions = dbSubmissions.filter(sub => {
    const profile = sub.profiles || {};
    const searchMatch = !filters.search || 
      (profile.full_name || '').toLowerCase().includes(filters.search.toLowerCase()) || 
      (profile.email || '').toLowerCase().includes(filters.search.toLowerCase());
    const collegeMatch = filters.college === 'all' || profile.college_name === filters.college;
    const cityMatch = filters.city === 'all' || profile.city === filters.city;
    
    const reviewStatusMatch = queueReviewFilter === 'all' || sub.review_status === queueReviewFilter;
    return searchMatch && collegeMatch && cityMatch && reviewStatusMatch;
  });

  // React Query Hook for Assessment Queue Candidates
  const { data: onboardingData, isLoading: isQueueLoading } = useOnboardingInterns();
  const allCandidates = onboardingData?.interns || [];
  
  // Filter for candidates currently at the Questionnaire stage
  const questionnaireCandidates = allCandidates.filter(c => 
    c.currentStepName === 'Questionnaire' || c.questionnaireCompleted
  );

  const filteredQueue = questionnaireCandidates.filter(c => {
    const searchMatch = !filters.search || 
      c.fullName.toLowerCase().includes(filters.search.toLowerCase()) || 
      c.email.toLowerCase().includes(filters.search.toLowerCase());
    const collegeMatch = filters.college === 'all' || c.collegeName === filters.college;
    const cityMatch = filters.city === 'all' || c.city === filters.city;
    return searchMatch && collegeMatch && cityMatch;
  });

  const collegeOptions = Array.from(
    new Set(allCandidates.map((c) => c.collegeName).filter((col) => col && col !== 'N/A'))
  );
  const cityOptions = Array.from(
    new Set(allCandidates.map((c) => c.city).filter((ct) => ct && ct !== 'N/A'))
  );

  // Fetch Questionnaires
  const fetchQuestionnaires = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('questionnaires')
        .select('*')
        .order('created_at', { ascending: true });

      if (fetchErr) throw fetchErr;
      setQuestionnaires(data || []);
      
      // Auto select first questionnaire if none selected
      if (data && data.length > 0 && !selectedQuestionnaire) {
        setSelectedQuestionnaire(data[0]);
      }
    } catch (err) {
      console.error('Error fetching questionnaires:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Questions for selected questionnaire
  const fetchQuestions = async (questionnaireId) => {
    if (!questionnaireId) return;
    try {
      const { data, error: fetchErr } = await supabase
        .from('questionnaire_questions')
        .select('*')
        .eq('questionnaire_id', questionnaireId)
        .order('display_order', { ascending: true });

      if (fetchErr) throw fetchErr;
      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  useEffect(() => {
    if (selectedQuestionnaire?.id) {
      fetchQuestions(selectedQuestionnaire.id);
    } else {
      setQuestions([]);
    }
  }, [selectedQuestionnaire]);

  const showTempSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Questionnaire Actions
  const handleOpenQuestionnaireModal = (q = null) => {
    if (q) {
      setEditingQuestionnaire(q);
      setQTitle(q.title || '');
      setQDescription(q.description || '');
      setQCategory(q.category || 'tech');
      setQIsActive(q.is_active ?? true);
    } else {
      setEditingQuestionnaire(null);
      setQTitle('');
      setQDescription('');
      setQCategory('tech');
      setQIsActive(true);
    }
    setShowQuestionnaireModal(true);
  };

  const handleSaveQuestionnaire = async (e) => {
    e.preventDefault();
    if (!qTitle.trim() || savingQuestionnaire) return;

    try {
      setSavingQuestionnaire(true);
      setError(null);

      if (editingQuestionnaire?.id) {
        // Edit Mode: Check if category is being changed to another already-existing category
        if (editingQuestionnaire.category !== qCategory) {
          const { data: catCheck, error: catCheckErr } = await supabase
            .from('questionnaires')
            .select('id, title, category')
            .eq('category', qCategory)
            .neq('id', editingQuestionnaire.id)
            .maybeSingle();

          if (catCheckErr) throw catCheckErr;
          if (catCheck) {
            throw new Error(
              'A questionnaire already exists for this category. Please edit the existing questionnaire.'
            );
          }
        }

        // Perform Update
        const { data, error: updateErr } = await supabase
          .from('questionnaires')
          .update({
            title: qTitle.trim(),
            description: qDescription.trim() || null,
            category: qCategory,
            is_active: qIsActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingQuestionnaire.id)
          .select()
          .single();

        if (updateErr) throw updateErr;

        setQuestionnaires(prev => prev.map(item => item.id === data.id ? data : item));
        if (selectedQuestionnaire?.id === data.id) setSelectedQuestionnaire(data);
        showTempSuccess('Questionnaire updated successfully');
        setShowQuestionnaireModal(false);
      } else {
        // Create Mode: Check if a questionnaire already exists for the selected category
        const { data: existing, error: existingErr } = await supabase
          .from('questionnaires')
          .select('id, title, category')
          .eq('category', qCategory)
          .maybeSingle();

        if (existingErr) throw existingErr;

        if (existing) {
          throw new Error(
            'A questionnaire already exists for this category. Please edit the existing questionnaire.'
          );
        }

        // Perform Insert
        const { data, error: createErr } = await supabase
          .from('questionnaires')
          .insert({
            title: qTitle.trim(),
            description: qDescription.trim() || null,
            category: qCategory,
            is_active: qIsActive
          })
          .select()
          .single();

        if (createErr) throw createErr;

        setQuestionnaires(prev => [...prev, data]);
        setSelectedQuestionnaire(data);
        showTempSuccess('Questionnaire created successfully');
        setShowQuestionnaireModal(false);
      }
    } catch (err) {
      console.error('Save Questionnaire error:', err);
      if (err?.code === '23505' || err?.message?.includes('uq_questionnaires_category')) {
        setError('A questionnaire already exists for this category. Open the existing questionnaire and edit it.');
      } else {
        setError(err.message || 'Failed to save questionnaire.');
      }
    } finally {
      setSavingQuestionnaire(false);
    }
  };

  const handleToggleQuestionnaireActive = async (q) => {
    try {
      setError(null);
      const newStatus = !q.is_active;
      const { data, error: toggleErr } = await supabase
        .from('questionnaires')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', q.id)
        .select()
        .single();

      if (toggleErr) throw toggleErr;
      setQuestionnaires(prev => prev.map(item => item.id === data.id ? data : item));
      if (selectedQuestionnaire?.id === data.id) setSelectedQuestionnaire(data);
      showTempSuccess(`Questionnaire ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteQuestionnaire = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this questionnaire and all its questions?')) return;
    try {
      setError(null);
      const { error: delErr } = await supabase
        .from('questionnaires')
        .delete()
        .eq('id', qId);

      if (delErr) throw delErr;
      const updatedList = questionnaires.filter(item => item.id !== qId);
      setQuestionnaires(updatedList);
      if (selectedQuestionnaire?.id === qId) {
        setSelectedQuestionnaire(updatedList[0] || null);
      }
      showTempSuccess('Questionnaire deleted successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  // Question Actions
  const handleOpenQuestionModal = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      setQText(question.question_text || '');
      setQType(question.question_type || 'text');
      setQOptions(Array.isArray(question.options) && question.options.length >= 2 ? question.options : ['', '']);
      setQIsRequired(question.is_required ?? true);
    } else {
      setEditingQuestion(null);
      setQText('');
      setQType('text');
      setQOptions(['', '']);
      setQIsRequired(true);
    }
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!qText.trim() || !selectedQuestionnaire) return;

    let processedOptions = null;
    if (qType === 'single_choice' || qType === 'multiple_choice') {
      const cleanOpts = qOptions.map(o => o.trim()).filter(Boolean);
      if (cleanOpts.length < 2) {
        setError('Choice questions require at least 2 non-empty options.');
        return;
      }
      processedOptions = cleanOpts;
    }

    try {
      setError(null);
      if (editingQuestion) {
        const { data, error: updateErr } = await supabase
          .from('questionnaire_questions')
          .update({
            question_text: qText.trim(),
            question_type: qType,
            options: processedOptions,
            is_required: qIsRequired,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingQuestion.id)
          .select()
          .single();

        if (updateErr) throw updateErr;
        setQuestions(prev => prev.map(item => item.id === data.id ? data : item));
        showTempSuccess('Question updated successfully');
      } else {
        const nextOrder = questions.length > 0 ? Math.max(...questions.map(q => q.display_order || 0)) + 1 : 1;
        const { data, error: createErr } = await supabase
          .from('questionnaire_questions')
          .insert({
            questionnaire_id: selectedQuestionnaire.id,
            question_text: qText.trim(),
            question_type: qType,
            options: processedOptions,
            is_required: qIsRequired,
            display_order: nextOrder,
            is_active: true
          })
          .select()
          .single();

        if (createErr) throw createErr;
        setQuestions(prev => [...prev, data]);
        showTempSuccess('Question added successfully');
      }
      setShowQuestionModal(false);
    } catch (err) {
      console.error('Save question error:', err);
      setError(err.message);
    }
  };

  const handleToggleQuestionActive = async (question) => {
    try {
      setError(null);
      const newStatus = !question.is_active;
      const { data, error: toggleErr } = await supabase
        .from('questionnaire_questions')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', question.id)
        .select()
        .single();

      if (toggleErr) throw toggleErr;
      setQuestions(prev => prev.map(item => item.id === data.id ? data : item));
      showTempSuccess(`Question ${newStatus ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      setError(null);
      const { error: delErr } = await supabase
        .from('questionnaire_questions')
        .delete()
        .eq('id', qId);

      if (delErr) throw delErr;
      setQuestions(prev => prev.filter(item => item.id !== qId));
      showTempSuccess('Question deleted');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMoveQuestion = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;

    // Re-assign display_order
    const updatedWithOrder = newQuestions.map((q, idx) => ({ ...q, display_order: idx + 1 }));
    setQuestions(updatedWithOrder);

    try {
      // Upsert order updates
      for (const item of updatedWithOrder) {
        await supabase
          .from('questionnaire_questions')
          .update({ display_order: item.display_order })
          .eq('id', item.id);
      }
    } catch (err) {
      console.error('Failed to update question order:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">Questionnaire Management</h1>
          <p className="text-sm text-[#9A9A9A] font-medium mt-0.5">
            Create and manage Technical, Non-Technical, and AI Tools questionnaires.
          </p>
        </div>
        {activeTab === 'builder' && (
          <button
            onClick={() => handleOpenQuestionnaireModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-[#FF3D00]/20 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Questionnaire</span>
          </button>
        )}
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 text-sm font-medium">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Module Tabs */}
      <div className="flex border-b border-[#EDEDED] gap-8">
        <button
          onClick={() => setActiveTab('builder')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'builder'
              ? 'border-[#FF8A00] text-[#FF8A00]'
              : 'border-transparent text-[#9A9A9A] hover:text-[#0D0D0D]'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Questionnaire Builder</span>
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'queue'
              ? 'border-[#FF8A00] text-[#FF8A00]'
              : 'border-transparent text-[#9A9A9A] hover:text-[#0D0D0D]'
          }`}
        >
          <ListChecks className="h-4 w-4" />
          <span>Assessment Queue</span>
          <span className="px-2 py-0.5 text-xs bg-[#F7F7F7] text-[#0D0D0D] border border-[#EDEDED] rounded-full font-bold">
            {questionnaireCandidates.length}
          </span>
        </button>
      </div>

      {/* Tab Content 1: Questionnaire Builder */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Questionnaire Selector List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider">Questionnaires</h2>
              <span className="text-xs font-semibold text-[#9A9A9A]">{questionnaires.length} Total</span>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-white border border-[#EDEDED] rounded-2xl">
                <div className="animate-spin h-6 w-6 border-2 border-[#FF8A00] border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-[#9A9A9A] font-medium">Loading questionnaires...</p>
              </div>
            ) : questionnaires.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#EDEDED] rounded-2xl space-y-3">
                <FileText className="h-8 w-8 text-[#9A9A9A] mx-auto" />
                <p className="text-sm font-semibold text-[#0D0D0D]">No Questionnaires Found</p>
                <p className="text-xs text-[#9A9A9A]">Click 'Create Questionnaire' to add your first assessment.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {questionnaires.map((q) => {
                  const isSelected = selectedQuestionnaire?.id === q.id;
                  return (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuestionnaire(q)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-white border-[#FF8A00] shadow-md shadow-[#FF8A00]/5 ring-1 ring-[#FF8A00]'
                          : 'bg-white border-[#EDEDED] hover:border-[#FF8A00]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                              q.category === 'tech' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                              q.category === 'non_tech' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                              'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                              {q.category === 'tech' ? 'Tech' : q.category === 'non_tech' ? 'Non-Tech' : 'AI Tools'}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              q.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {q.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-[#0D0D0D]">{q.title}</h3>
                          {q.description && (
                            <p className="text-xs text-[#9A9A9A] line-clamp-2">{q.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F7F7F7]">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleOpenQuestionnaireModal(q); }}
                          className="p-1.5 rounded-lg text-[#9A9A9A] hover:text-[#0D0D0D] hover:bg-[#F7F7F7] transition-all"
                          title="Edit Questionnaire"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleQuestionnaireActive(q); }}
                          className={`p-1.5 rounded-lg transition-all ${
                            q.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={q.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteQuestionnaire(q.id); }}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all ml-auto"
                          title="Delete Questionnaire"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Questions Editor for Selected Questionnaire */}
          <div className="lg:col-span-8 space-y-4">
            {selectedQuestionnaire ? (
              <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
                {/* Header of selected questionnaire */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDEDED] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#FF8A00] uppercase tracking-wider">Managing Questions</span>
                      <span className="text-xs text-[#9A9A9A]">• {questions.length} Questions</span>
                    </div>
                    <h2 className="text-xl font-bold text-[#0D0D0D]">{selectedQuestionnaire.title}</h2>
                    {selectedQuestionnaire.description && (
                      <p className="text-xs text-[#9A9A9A] mt-1">{selectedQuestionnaire.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenQuestionModal()}
                    className="flex items-center gap-2 px-3.5 py-2 bg-[#0D0D0D] text-white text-xs font-bold rounded-xl hover:bg-[#FF8A00] transition-all self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                {/* Questions List */}
                {questions.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-[#EDEDED] rounded-2xl space-y-3">
                    <HelpCircle className="h-10 w-10 text-[#9A9A9A] mx-auto" />
                    <p className="text-sm font-semibold text-[#0D0D0D]">No Questions Added Yet</p>
                    <p className="text-xs text-[#9A9A9A]">Add Text, Single Choice, or Multiple Choice questions to construct this questionnaire.</p>
                    <button
                      onClick={() => handleOpenQuestionModal()}
                      className="px-4 py-2 bg-[#F7F7F7] text-[#0D0D0D] text-xs font-bold rounded-xl border border-[#EDEDED] hover:border-[#FF8A00] transition-all inline-flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#FF8A00]" />
                      <span>Add First Question</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q, index) => (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border transition-all ${
                          q.is_active ? 'bg-white border-[#EDEDED]' : 'bg-gray-50 border-gray-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                disabled={index === 0}
                                onClick={() => handleMoveQuestion(index, 'up')}
                                className="p-1 rounded hover:bg-[#F7F7F7] disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <ChevronUp className="h-3.5 w-3.5 text-[#9A9A9A]" />
                              </button>
                              <span className="text-xs font-extrabold text-[#9A9A9A]">Q{index + 1}</span>
                              <button
                                disabled={index === questions.length - 1}
                                onClick={() => handleMoveQuestion(index, 'down')}
                                className="p-1 rounded hover:bg-[#F7F7F7] disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <ChevronDown className="h-3.5 w-3.5 text-[#9A9A9A]" />
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                                  q.question_type === 'text' ? 'bg-slate-100 text-slate-700' :
                                  q.question_type === 'single_choice' ? 'bg-emerald-50 text-emerald-700' :
                                  'bg-indigo-50 text-indigo-700'
                                }`}>
                                  {q.question_type === 'text' ? 'Text Answer' :
                                   q.question_type === 'single_choice' ? 'Single Choice' :
                                   'Multiple Choice'}
                                </span>
                                {q.is_required && (
                                  <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>
                                )}
                                {!q.is_active && (
                                  <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">Disabled</span>
                                )}
                              </div>
                              <p className="font-semibold text-sm text-[#0D0D0D]">{q.question_text}</p>
                              
                              {/* Render options preview if choice question */}
                              {Array.isArray(q.options) && q.options.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {q.options.map((opt, optIdx) => (
                                    <span key={optIdx} className="px-2 py-0.5 bg-[#F7F7F7] border border-[#EDEDED] text-[#0D0D0D] text-xs rounded-md">
                                      {opt}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action icons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleToggleQuestionActive(q)}
                              className={`p-1.5 rounded-lg text-xs font-semibold ${
                                q.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={q.is_active ? 'Disable Question' : 'Enable Question'}
                            >
                              <Power className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenQuestionModal(q)}
                              className="p-1.5 rounded-lg text-[#9A9A9A] hover:text-[#0D0D0D] hover:bg-[#F7F7F7]"
                              title="Edit Question"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete Question"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center bg-white border border-[#EDEDED] rounded-2xl">
                <FileText className="h-10 w-10 text-[#9A9A9A] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#0D0D0D]">Select a Questionnaire</p>
                <p className="text-xs text-[#9A9A9A]">Choose a questionnaire from the left panel to manage its questions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Assessment Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Status Filter Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-[#EDEDED] pb-3">
            {[
              { id: 'all', label: 'All Submissions' },
              { id: 'pending', label: 'Pending Review' },
              { id: 'approved', label: 'Approved' },
              { id: 'correction_required', label: 'Correction Required' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setQueueReviewFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                  queueReviewFilter === tab.id
                    ? 'bg-[#0D0D0D] text-white border-[#0D0D0D]'
                    : 'bg-white text-[#9A9A9A] border-[#EDEDED] hover:border-[#FF8A00] hover:text-[#0D0D0D]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <ManagementFilterBar
            filters={filters}
            setFilters={setFilters}
            initialFilters={initialFilters}
            problemStatementOptions={[]}
            collegeOptions={collegeOptions}
            cityOptions={cityOptions}
            statusOptions={[]}
            activeTabTitle="Assessment Queue Candidates"
          />

          <div className="bg-white border border-[#EDEDED] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#EDEDED] bg-[#F7F7F7]/50 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
                Questionnaire Submissions ({filteredDbSubmissions.length})
              </span>
              <span className="text-xs text-[#9A9A9A] font-medium">Stage 2: Questionnaire Assessment</span>
            </div>

            {loadingSubmissions ? (
              <div className="p-12 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-[#FF8A00] border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-[#9A9A9A] font-medium">Loading questionnaire assessment queue...</p>
              </div>
            ) : filteredDbSubmissions.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="h-8 w-8 text-[#9A9A9A] mx-auto" />
                <p className="text-sm font-semibold text-[#0D0D0D]">No submissions found</p>
                <p className="text-xs text-[#9A9A9A]">No intern submissions matching the current filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F7] text-[#0D0D0D] font-bold border-b border-[#EDEDED] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Intern Name</th>
                      <th className="p-3.5">Questionnaire & Category</th>
                      <th className="p-3.5">Submission Date</th>
                      <th className="p-3.5">Review Status</th>
                      <th className="p-3.5">Onboarding Stage</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEDED]">
                    {filteredDbSubmissions.map((sub) => {
                      const profile = sub.profiles || {};
                      const qTitle = sub.questionnaires?.title || 'Questionnaire';
                      const qCat = sub.questionnaires?.category || 'tech';
                      return (
                        <tr key={sub.id} className="hover:bg-[#F7F7F7]/50 transition-colors">
                          <td className="p-3.5 font-bold text-[#0D0D0D]">
                            <div>{profile.full_name || 'Intern'}</div>
                            <div className="text-[11px] text-[#9A9A9A] font-normal">{profile.email}</div>
                          </td>
                          <td className="p-3.5 text-[#0D0D0D]">
                            <div className="font-semibold">{qTitle}</div>
                            <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              {qCat}
                            </span>
                          </td>
                          <td className="p-3.5 text-[#9A9A9A]">
                            {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-3.5">
                            {sub.review_status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Approved</span>
                              </span>
                            ) : sub.review_status === 'correction_required' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 font-bold rounded-lg border border-red-200">
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Correction Required</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Pending Review</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-medium text-[#0D0D0D]">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg">
                              {profile.onboarding_status || 'questionnaire_pending'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleOpenReviewDialog(sub.id)}
                              className="px-3 py-1.5 bg-[#0D0D0D] text-white text-xs font-bold rounded-lg hover:bg-[#FF8A00] transition-all"
                            >
                              Review Submission
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Questionnaire */}
      {showQuestionnaireModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#EDEDED]">
            <h3 className="text-lg font-bold text-[#0D0D0D]">
              {editingQuestionnaire ? 'Edit Questionnaire' : 'Create Questionnaire'}
            </h3>
            <form onSubmit={handleSaveQuestionnaire} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="e.g. Technical Assessment Questionnaire"
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm font-medium text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase mb-1">Category</label>
                <select
                  value={qCategory}
                  onChange={(e) => setQCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm font-medium text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                >
                  <option value="tech">Technical (tech)</option>
                  <option value="non_tech">Non-Technical (non_tech)</option>
                  <option value="ai_tools">AI Tools (ai_tools)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={qDescription}
                  onChange={(e) => setQDescription(e.target.value)}
                  placeholder="Briefly describe the purpose of this questionnaire..."
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm font-medium text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="qIsActiveCheck"
                  checked={qIsActive}
                  onChange={(e) => setQIsActive(e.target.checked)}
                  className="rounded border-[#EDEDED] text-[#FF8A00] focus:ring-[#FF8A00]"
                />
                <label htmlFor="qIsActiveCheck" className="text-xs font-bold text-[#0D0D0D]">
                  Active Questionnaire
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionnaireModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#9A9A9A] hover:text-[#0D0D0D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuestionnaire}
                  className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingQuestionnaire ? (
                    <span>Saving...</span>
                  ) : (
                    <span>{editingQuestionnaire ? 'Update' : 'Create'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Question */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#EDEDED] my-8">
            <h3 className="text-lg font-bold text-[#0D0D0D]">
              {editingQuestion ? 'Edit Question' : 'Add Question'}
            </h3>
            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase mb-1">Question Text</label>
                <textarea
                  required
                  rows={2}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter the question text..."
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm font-medium text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] uppercase mb-1">Question Type</label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-sm font-medium text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                >
                  <option value="text">Text (Written Answer)</option>
                  <option value="single_choice">Single Choice (Radio Buttons)</option>
                  <option value="multiple_choice">Multiple Choice (Multiple Select)</option>
                </select>
              </div>

              {/* Options Section for Choice types */}
              {(qType === 'single_choice' || qType === 'multiple_choice') && (
                <div className="space-y-2 border-t border-b border-[#EDEDED] py-3">
                  <label className="block text-xs font-bold text-[#0D0D0D] uppercase">Options (Min 2)</label>
                  {qOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[idx] = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-medium text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                      />
                      {qOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setQOptions(qOptions.filter((_, i) => i !== idx))}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQOptions([...qOptions, ''])}
                    className="text-xs font-bold text-[#FF8A00] hover:underline flex items-center gap-1 pt-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Another Option</span>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="qIsRequiredCheck"
                  checked={qIsRequired}
                  onChange={(e) => setQIsRequired(e.target.checked)}
                  className="rounded border-[#EDEDED] text-[#FF8A00] focus:ring-[#FF8A00]"
                />
                <label htmlFor="qIsRequiredCheck" className="text-xs font-bold text-[#0D0D0D]">
                  Mandatory / Required Question
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#9A9A9A] hover:text-[#0D0D0D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl hover:shadow-md transition-all"
                >
                  {editingQuestion ? 'Save Changes' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Super Admin Submission Review Dialog */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-xl border border-[#EDEDED] my-8">
            <div className="flex items-center justify-between border-b border-[#EDEDED] pb-4">
              <div>
                <span className="text-xs font-bold text-[#FF8A00] uppercase tracking-wider">Submission Review</span>
                <h3 className="text-xl font-bold text-[#0D0D0D]">
                  {reviewSubmissionData?.submission?.profiles?.full_name || 'Intern Answers'}
                </h3>
                <p className="text-xs text-[#9A9A9A]">
                  {reviewSubmissionData?.submission?.questionnaires?.title} • {reviewSubmissionData?.submission?.profiles?.email}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 rounded-xl text-[#9A9A9A] hover:text-[#0D0D0D] hover:bg-[#F7F7F7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reviewLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-[#FF8A00] border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-[#9A9A9A] font-medium">Loading submission details...</p>
              </div>
            ) : reviewSubmissionData ? (
              <div className="space-y-6">
                {/* Questions & Intern Answers List */}
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {reviewSubmissionData.questions.map((q, idx) => {
                    const ans = q.answer;
                    return (
                      <div key={q.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#FF8A00]">Q{idx + 1} ({q.question_type})</span>
                          {q.is_required && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>
                          )}
                        </div>
                        <p className="font-semibold text-xs text-[#0D0D0D]">{q.question_text}</p>
                        
                        <div className="p-3 bg-white border border-[#EDEDED] rounded-lg text-xs font-medium text-[#0D0D0D]">
                          {q.question_type === 'text' ? (
                            ans?.answer_text || <span className="text-gray-400 italic">No answer provided</span>
                          ) : (
                            Array.isArray(ans?.answer_options) && ans.answer_options.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {ans.answer_options.map((opt, oIdx) => (
                                  <span key={oIdx} className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold border border-blue-200 rounded">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No option selected</span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submission View Footer - Read-Only */}
                <div className="border-t border-[#EDEDED] pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-5 py-2.5 bg-[#0D0D0D] text-white font-bold text-xs rounded-xl hover:bg-[#FF8A00] transition-all"
                  >
                    Close View
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
