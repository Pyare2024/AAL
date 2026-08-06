import React, { useEffect, useState } from 'react';
import { announcementService } from '../../services/announcementService';

interface Props {
  announcementId: string;
}

export const AnnouncementAnalytics: React.FC<Props> = ({ announcementId }) => {
  const [analytics, setAnalytics] = useState<{
    targeted_count: number;
    read_count: number;
    unread_count: number;
    read_percentage: number;
    last_read_at: string | null;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await announcementService.getAnnouncementAnalytics(announcementId);
        if (mounted) setAnalytics(data);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load analytics.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadAnalytics();
    return () => { mounted = false; };
  }, [announcementId]);

  if (isLoading) {
    return <div className="p-4 bg-[#F7F7F7] rounded-xl animate-pulse h-24"></div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold text-center">
        {error}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="p-4 md:p-6 bg-[#F7F7F7] rounded-xl border border-[#EDEDED] mt-6">
      <h3 className="text-base font-bold text-[#171717] mb-4">Read Analytics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-3 rounded-lg border border-[#EDEDED]">
          <div className="text-xs text-[#737373] font-bold uppercase mb-1">Targeted</div>
          <div className="text-xl font-bold text-[#171717]">{analytics.targeted_count}</div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-[#EDEDED]">
          <div className="text-xs text-[#737373] font-bold uppercase mb-1">Read</div>
          <div className="text-xl font-bold text-[#171717]">{analytics.read_count}</div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-[#EDEDED]">
          <div className="text-xs text-[#737373] font-bold uppercase mb-1">Unread</div>
          <div className="text-xl font-bold text-[#171717]">{analytics.unread_count}</div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-[#EDEDED]">
          <div className="text-xs text-[#737373] font-bold uppercase mb-1">Read %</div>
          <div className="text-xl font-bold text-[#FF8A00]">{analytics.read_percentage}%</div>
        </div>
      </div>
      
      {analytics.last_read_at && (
        <div className="mt-4 text-xs text-[#737373] font-medium text-right">
          Last read: {new Date(analytics.last_read_at).toLocaleString()}
        </div>
      )}
    </div>
  );
};
