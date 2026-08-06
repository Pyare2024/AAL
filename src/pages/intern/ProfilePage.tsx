import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { fetchProfileData, updatePersonalInformation } from '../../services/profileService';
import { ProfileHeader, PersonalInformationCard } from '../../components/profile/ProfileComponents';
import { ProfileData, PersonalInformation } from '../../types/profileTypes';
import { LoadingState, ErrorState } from '../../components/productivity/CommonStates';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const userId = (user as any)?.id || 'demo-user';
      const data = await fetchProfileData(userId);
      setProfile(data);
    } catch (err: any) {
      setErrorMsg('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [(user as any)?.id]);

  const handleSavePersonal = async (updatedPersonal: PersonalInformation) => {
    setFeedback(null);
    if (!profile) return;

    const userId = (user as any)?.id || 'demo-user';
    const res = await updatePersonalInformation(userId, updatedPersonal);
    if (res.success) {
      setProfile({
        ...profile,
        personal: updatedPersonal
      });
      setIsEditing(false);
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  if (loading) return <div className="p-6"><LoadingState message="Loading Profile..." /></div>;
  if (errorMsg || !profile) return <div className="p-6"><ErrorState message={errorMsg || 'Profile not found.'} onRetry={loadData} /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs font-bold ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Section 1: Profile Header */}
      <ProfileHeader
        profile={profile}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
      />

      {/* Section 2: Personal Information */}
      <PersonalInformationCard
        personal={profile.personal}
        isEditing={isEditing}
        onSave={handleSavePersonal}
        onCancel={() => setIsEditing(false)}
      />
    </div>
  );
}
