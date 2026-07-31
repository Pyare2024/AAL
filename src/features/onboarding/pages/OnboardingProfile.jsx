import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { updateOnboardingStepProgress } from '../../../utils/onboardingUtils';
import { 
  User, 
  Building2, 
  GraduationCap, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Link as LinkIcon,
  Globe
} from 'lucide-react';

export function OnboardingProfile() {
  const navigate = useNavigate();
  const { user, profile, refreshUserData } = useAuth();

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    college_name: profile?.college_name || '',
    city: profile?.city || '',
    degree_name: profile?.degree_name || '',
    degree_year: profile?.degree_year || '',
    gender: profile?.gender || '',
    date_of_birth: profile?.date_of_birth || '',
    linkedin_url: profile?.linkedin_url || '',
    github_url: profile?.github_url || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateLinkedIn = (url) => {
    if (!url || !url.trim()) return 'LinkedIn Profile URL is required.';
    const trimmed = url.trim();
    if (!trimmed.startsWith('https://') || !trimmed.includes('linkedin.com/in/')) {
      return 'Please enter a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/username).';
    }
    return null;
  };

  const validateGitHub = (url) => {
    if (!url || !url.trim()) return 'GitHub Profile URL is required.';
    const trimmed = url.trim();
    if (!trimmed.startsWith('https://') || !trimmed.includes('github.com/')) {
      return 'Please enter a valid GitHub profile URL (e.g. https://github.com/username).';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate LinkedIn URL
    const linkedinErr = validateLinkedIn(formData.linkedin_url);
    if (linkedinErr) {
      setError(linkedinErr);
      return;
    }

    // Validate GitHub URL
    const githubErr = validateGitHub(formData.github_url);
    if (githubErr) {
      setError(githubErr);
      return;
    }

    if (!user) {
      // Demo fallback if not authenticated yet
      navigate('/onboarding/questionnaire');
      return;
    }

    setLoading(true);
    try {
      const targetId = profile?.id || user?.id;
      if (process.env.NODE_ENV !== 'production') {
        console.log('Onboarding profile submit target intern_id (profiles.id):', targetId);
      }

      // 1. Update Profile in database
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          college_name: formData.college_name,
          city: formData.city,
          degree_name: formData.degree_name,
          degree_year: formData.degree_year,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth || null,
          linkedin_url: formData.linkedin_url.trim(),
          github_url: formData.github_url.trim(),
          onboarding_status: 'questionnaire_pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId);

      if (profileErr) throw profileErr;

      // 2. Update Onboarding Progress via shared utility
      const { nextRoute } = await updateOnboardingStepProgress(targetId, {
        profile_completed: true,
      });

      if (refreshUserData) {
        await refreshUserData();
      }

      navigate(nextRoute || '/onboarding/questionnaire', { replace: true });
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Onboarding Stepper Header */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-[#FF3D00] uppercase tracking-wider">Step 1 of 5</span>
            <h1 className="text-xl font-bold text-[#0D0D0D]">Basic Profile Information</h1>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 text-[#FF3D00] rounded-full">
            20% Complete
          </span>
        </div>
        <div className="w-full bg-[#EDEDED] h-2 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] h-full w-[20%] transition-all duration-500"></div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
        {error && (
          <div className="p-3.5 bg-[#FF3D00]/10 border border-[#FF3D00]/20 rounded-xl text-xs font-semibold text-[#FF3D00]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Alex Johnson"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">College / University Name</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
              <input
                type="text"
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                placeholder="Apex Institute of Technology"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">City</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mumbai"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Degree / Branch</label>
            <div className="relative">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
              <input
                type="text"
                name="degree_name"
                value={formData.degree_name}
                onChange={handleChange}
                placeholder="B.Tech Computer Engineering"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Year of Study</label>
            <select
              name="degree_year"
              value={formData.degree_year}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="">Select Year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="Final Year">Final Year / Passed Out</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
            />
          </div>
        </div>

        {/* New Social Profiles Section: LinkedIn & GitHub */}
        <div className="pt-2 border-t border-[#EDEDED] space-y-4">
          <h3 className="text-xs font-bold text-[#FF8A00] uppercase tracking-wider">Social Profiles (Mandatory)</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* LinkedIn Field */}
            <div>
              <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                LinkedIn Profile <span className="text-[#FF3D00]">*</span>
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0077B5]" />
                <input
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  placeholder="https://www.linkedin.com/in/your-profile"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>
            </div>

            {/* GitHub Field */}
            <div>
              <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                GitHub Profile <span className="text-[#FF3D00]">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0D0D0D]" />
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  placeholder="https://github.com/your-username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 flex items-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Save & Continue to Questionnaire</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
