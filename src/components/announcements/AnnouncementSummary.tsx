import React from 'react';

interface Props {
  summary: any;
  role: string;
  isLoading?: boolean;
}

export const AnnouncementSummary: React.FC<Props> = ({ summary, role, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white border border-[#EDEDED] rounded-xl p-4 shadow-sm animate-pulse">
            <div className="h-3 w-16 bg-[#F5F5F5] rounded mb-2"></div>
            <div className="h-6 w-10 bg-[#E5E5E5] rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const getCards = () => {
    if (role === 'intern') {
      return [
        { label: 'Total', value: summary.total },
        { label: 'Unread', value: summary.unread },
        { label: 'Important', value: summary.important },
        { label: 'Pinned', value: summary.pinned },
      ];
    } else if (role === 'admin') {
      return [
        { label: 'Total', value: summary.total },
        { label: 'Published', value: summary.published },
        { label: 'Scheduled', value: summary.scheduled },
        { label: 'Drafts', value: summary.drafts },
      ];
    } else {
      return [
        { label: 'Total', value: summary.total },
        { label: 'Published', value: summary.published },
        { label: 'Scheduled', value: summary.scheduled },
        { label: 'Archived', value: summary.archived },
      ];
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {getCards().map((card) => (
        <div key={card.label} className="bg-white border border-[#EDEDED] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[#737373] uppercase mb-1">{card.label}</div>
          <div className="text-2xl font-bold text-[#171717]">{card.value}</div>
        </div>
      ))}
    </div>
  );
};
