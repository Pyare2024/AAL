import React from 'react';
import { FeedbackSummary as SummaryType } from '../../types/feedbackTypes';

interface Props {
  summary: SummaryType;
  role: string;
}

export const FeedbackSummary: React.FC<Props> = ({ summary, role }) => {
  const formatKey = (key: string) => {
    if (key === 'total') return role === 'intern' ? 'My Feedback' : 'Total Feedback';
    if (key === 'pending') return role === 'intern' ? 'Awaiting Reply' : 'Open/Pending';
    if (key === 'resolved') return 'Resolved';
    if (key === 'critical') return 'Critical';
    if (key === 'escalated') return 'Escalated';
    return key;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(summary).map(([key, value]) => (
        <div key={key} className="bg-white border border-[#EDEDED] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[#737373] uppercase mb-1">{formatKey(key)}</div>
          <div className="text-2xl font-bold text-[#171717]">{value}</div>
        </div>
      ))}
    </div>
  );
};
