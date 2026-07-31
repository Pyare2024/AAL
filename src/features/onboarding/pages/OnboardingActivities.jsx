import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { updateOnboardingStepProgress } from '../../../utils/onboardingUtils';
import { CheckCircle2, Link as LinkIcon, AlertCircle, ArrowRight, Loader2, FolderUp } from 'lucide-react';

const mandatoryActivities = [
  {
    id: 1,
    title: 'Activity 1 – LinkedIn Basic Profile Optimization',
    desc: 'Optimize the intern’s LinkedIn headline, profile photo, banner, About section, education, skills, and other important profile sections according to ASG guidelines.',
  },
  {
    id: 2,
    title: 'Activity 2 – Research Using NotebookLM',
    desc: 'Select one topic and conduct detailed research using NotebookLM. Organize the important findings, references, notes, and insights.',
  },
  {
    id: 3,
    title: 'Activity 3 – AI Blog Using NotebookLM',
    desc: 'Create a clear and engaging blog based on the selected research topic using NotebookLM. The blog should include a proper title, introduction, main content, and conclusion.',
  },
  {
    id: 4,
    title: 'Activity 4 – Mind Map Using AI',
    desc: 'Create a visual mind map of the selected topic using an AI tool. It should clearly represent the main concept, subtopics, relationships, and workflow.',
  },
  {
    id: 5,
    title: 'Activity 5 – Infographic Using AI or YouTube',
    desc: 'Create an infographic that explains the selected topic visually. Use an AI tool or learn the process through YouTube and prepare a clear, informative design.',
  },
  {
    id: 6,
    title: 'Activity 6 – AI Presentation and Landing Page',
    desc: 'Create an AI-generated presentation about the selected topic and design a simple landing page that presents the idea clearly and professionally.',
  },
  {
    id: 7,
    title: 'Activity 7 – Complete Documentation',
    desc: 'Prepare detailed documentation of all seven activities. Include the complete process, tools used, prompts used, screenshots, outputs, challenges, and learning outcomes.',
  },
];

export function OnboardingActivities() {
  const navigate = useNavigate();
  const { user, refreshUserData } = useAuth();

  const [folderLink, setFolderLink] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingSubmissionId, setExistingSubmissionId] = useState(null);

  // Fetch existing submission if any
  useEffect(() => {
    async function loadExistingSubmission() {
      if (!user) {
        setFetching(false);
        return;
      }
      try {
        const { data, error: fetchErr } = await supabase
          .from('onboarding_final_submissions')
          .select('*')
          .eq('intern_id', user.id)
          .maybeSingle();

        if (data) {
          setFolderLink(data.google_drive_folder_url || '');
          setExistingSubmissionId(data.id);
        }
      } catch (err) {
        console.error('Error fetching existing final submission:', err);
      } finally {
        setFetching(false);
      }
    }
    loadExistingSubmission();
  }, [user]);

  const validateFolderUrl = (url) => {
    if (!url || !url.trim()) return 'Google Drive Folder link is required.';
    const trimmed = url.trim();

    if (!trimmed.startsWith('https://drive.google.com/')) {
      return 'The link must start with https://drive.google.com/';
    }

    // Reject individual file links
    if (trimmed.includes('/file/d/') || trimmed.includes('/document/d/') || trimmed.includes('/spreadsheets/d/')) {
      return 'Please provide a Google Drive FOLDER link, not an individual file link.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const validationErr = validateFolderUrl(folderLink);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    if (!user) {
      navigate('/onboarding/interview');
      return;
    }

    setLoading(true);
    try {
      const cleanUrl = folderLink.trim();

      // Upsert into onboarding_final_submissions using google_drive_folder_url
      if (existingSubmissionId) {
        // Update existing record
        const { error: updateErr } = await supabase
          .from('onboarding_final_submissions')
          .update({
            google_drive_folder_url: cleanUrl,
            status: 'submitted',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSubmissionId);

        if (updateErr) throw updateErr;
      } else {
        // Create new record
        const { data: newSub, error: insertErr } = await supabase
          .from('onboarding_final_submissions')
          .insert([
            {
              intern_id: user.id,
              google_drive_folder_url: cleanUrl,
              status: 'submitted',
            },
          ])
          .select()
          .single();

        if (insertErr) throw insertErr;
        if (newSub) setExistingSubmissionId(newSub.id);
      }

      // Mark activity step as completed in profiles & onboarding_progress via shared utility
      await supabase
        .from('profiles')
        .update({ onboarding_status: 'activities_pending', updated_at: new Date().toISOString() })
        .eq('id', user.id);

      const { nextRoute } = await updateOnboardingStepProgress(user.id, {
        activities_completed: true,
      });

      await refreshUserData();

      setSuccessMsg('Activity folder submitted successfully!');
      setTimeout(() => {
        navigate(nextRoute || '/onboarding/interview');
      }, 1200);
    } catch (err) {
      console.error('Submission Error:', err);
      setError(err.message || 'Failed to save final submission to onboarding_final_submissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stepper Header */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-[#FF3D00] uppercase tracking-wider">Step 4 of 5</span>
            <h1 className="text-xl font-bold text-[#0D0D0D]">Seven Mandatory Activities</h1>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 text-[#FF3D00] rounded-full">
            80% Complete
          </span>
        </div>
        <div className="w-full bg-[#EDEDED] h-2 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] h-full w-[80%] transition-all duration-500"></div>
        </div>
      </div>

      {/* Activity List Container */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">Required Activity Overview</h2>
        
        <div className="space-y-3">
          {mandatoryActivities.map((act) => (
            <div key={act.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-1.5">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-[#FF3D00] uppercase tracking-wider">{act.title}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF8A00] bg-[#FF8A00]/10 px-2 py-0.5 rounded">
                  <CheckCircle2 className="h-3 w-3" /> Mandatory
                </span>
              </div>
              <p className="text-xs text-[#0D0D0D] leading-relaxed">{act.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Single Common Submission Section */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3 p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl">
          <div className="p-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl shadow-sm shrink-0">
            <FolderUp className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#0D0D0D]">Submit Final Activity Folder</h3>
            <p className="text-xs text-[#9A9A9A] leading-relaxed">
              Upload all files, screenshots, presentations, documents, blog content, mind map, infographic, landing page details, and complete documentation into one Google Drive folder. Paste the public folder link below.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-[#FF3D00]/10 border border-[#FF3D00]/20 rounded-xl flex items-center gap-2 text-xs font-semibold text-[#FF3D00]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#0D0D0D] mb-1.5">
            Google Drive Folder Link <span className="text-[#FF3D00]">*</span>
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
            <input
              type="url"
              value={folderLink}
              onChange={(e) => setFolderLink(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              required
              disabled={loading || fetching}
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 transition-all disabled:opacity-60"
            />
          </div>
          <p className="text-[11px] text-[#9A9A9A] mt-1.5">
            ⚠️ Ensure the folder link is set to <strong className="text-[#0D0D0D]">"Anyone with the link can view"</strong>. Individual file links or private links will be rejected.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading || fetching}
            className="px-6 py-3.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 flex items-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting Folder...</span>
              </>
            ) : (
              <>
                <span>{existingSubmissionId ? 'Update Activity Folder' : 'Submit Activities & Check Interview Status'}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
