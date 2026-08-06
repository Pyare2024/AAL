import React, { useState } from 'react';
import { sampleLearningSummary, sampleLearningPlatforms } from '../../types/learningTypes';
import { LearningSummaryCard, LearningPlatformCard } from '../../components/learning/LearningComponents';
import { RefreshCw, AlertCircle, BookOpen } from 'lucide-react';
import { LoadingState, EmptyState, ErrorState } from '../../components/productivity/CommonStates';

export function LearningPage() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState(sampleLearningSummary);
  const [platforms, setPlatforms] = useState(sampleLearningPlatforms);

  const handleRefresh = async () => {
    setRefreshing(true);
    setErrorMsg(null);
    // Simulate backend synchronization
    setTimeout(() => {
      setSummary({
        ...sampleLearningSummary,
        lastSyncedAt: new Date().toISOString()
      });
      setRefreshing(false);
    }, 1000);
  };

  if (loading) {
    return <div className="p-6"><LoadingState message="Loading Learning Overview..." /></div>;
  }

  if (errorMsg) {
    return (
      <div className="p-6">
        <ErrorState message={errorMsg} onRetry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wider block">Module 4</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">Learning</h1>
          <p className="text-xs text-[#737373] mt-1">Continue your assigned learning and track your progress.</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] hover:bg-gray-100 text-[#171717] font-bold text-xs rounded-xl flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-[#FF8A00] ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Synchronizing...' : 'Refresh Progress'}</span>
        </button>
      </div>

      {/* Compact Learning Summary */}
      <LearningSummaryCard summary={summary} />

      {/* Main Learning Platforms Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#171717]">Assigned Learning Platforms</h3>
          <span className="text-xs text-[#737373]">2 Connected External Platforms</span>
        </div>

        {platforms.length === 0 ? (
          <EmptyState
            title="No Learning Platforms Connected"
            description="Contact your program administrator to get assigned to learning paths."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {platforms.map((platform) => (
              <LearningPlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
