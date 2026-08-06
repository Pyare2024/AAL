import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { fetchProductivitySummary } from '../../services/productivityService';
import { ProductivityModuleCard, TodayProgressChecklist } from '../../components/productivity/ProductivityOverviewComponents';
import { Calendar, FileText, CheckSquare, Briefcase, Clock } from 'lucide-react';
import { LoadingState, ErrorState } from '../../components/productivity/CommonStates';

export function ProductivityPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user?.id) throw new Error('Not authenticated');
      
      const summary = await fetchProductivitySummary(user.id);
      setData(summary);
    } catch (err) {
      setError(err.message || 'Failed to load productivity data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  if (loading) return <div className="max-w-7xl mx-auto p-4"><LoadingState message="Loading Productivity Overview..." /></div>;
  if (error) return <div className="max-w-7xl mx-auto p-4"><ErrorState message={error} onRetry={loadData} /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wider block">Productivity Overview</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717] mt-0.5">Daily Workflow Control</h1>
          <p className="text-xs text-[#737373] mt-1">Sequence: Attendance → Plan Work → Perform Work → Record Work → Submit Evidence</p>
        </div>
        <div className="px-4 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl flex items-center gap-2 shrink-0">
          <Clock className="h-4 w-4 text-[#FF8A00]" />
          <span className="text-xs font-bold text-[#171717]">{data?.todayDate}</span>
        </div>
      </div>

      {/* 4 Primary Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProductivityModuleCard
          title="Attendance"
          icon={Calendar}
          status={data?.attendanceStatus === 'present' ? 'Present' : data?.attendanceStatus === 'late' ? 'Late' : 'Not Marked'}
          statusBg={data?.attendanceStatus === 'present' ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}
          statusColor={data?.attendanceStatus === 'present' ? 'text-emerald-700' : 'text-[#FF8A00]'}
          countText={data?.checkInTime ? `Check-in: ${data.checkInTime}` : 'Check-in pending'}
          actionLabel="Mark Attendance"
          actionTo="/intern/attendance"
        />

        <ProductivityModuleCard
          title="Daily Diary"
          icon={FileText}
          status={data?.diaryStatus === 'submitted' ? 'Submitted' : 'Not Submitted'}
          statusBg={data?.diaryStatus === 'submitted' ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}
          statusColor={data?.diaryStatus === 'submitted' ? 'text-emerald-700' : 'text-[#FF8A00]'}
          countText={data?.diaryStatus === 'submitted' ? 'Logged for today' : 'Daily log pending'}
          actionLabel="Write Diary"
          actionTo="/intern/diary"
        />

        <ProductivityModuleCard
          title="To-do"
          icon={CheckSquare}
          status={`${data?.todoCompletedCount || 0} of ${data?.todoTotalCount || 0} Completed`}
          statusBg="bg-blue-50 border-blue-200"
          statusColor="text-blue-700"
          countText={`${(data?.todoTotalCount || 0) - (data?.todoCompletedCount || 0)} Remaining Tasks`}
          actionLabel="View Tasks"
          actionTo="/intern/todo"
        />

        <ProductivityModuleCard
          title="Pending Work"
          icon={Briefcase}
          status={`${data?.pendingWorkCount || 0} Pending`}
          statusBg={data?.overdueWorkCount > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}
          statusColor={data?.overdueWorkCount > 0 ? 'text-red-700' : 'text-amber-700'}
          countText={`${data?.overdueWorkCount || 0} Overdue Items`}
          actionLabel="View Work"
          actionTo="/intern/pending-work"
        />
      </div>

      {/* Today's Progress Checklist */}
      <TodayProgressChecklist progress={data?.progress} />
    </div>
  );
}
