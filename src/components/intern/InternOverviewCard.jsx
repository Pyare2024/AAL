import React from 'react';

export function InternOverviewCard({ user, profile, assignedAdmins }) {
  const userName = profile?.full_name || 'Intern';
  const userPhoto = profile?.profile_photo_url || null;
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const email = profile?.email || user?.email || 'Not configured';
  const mobile = profile?.mobile || user?.phone || 'Not configured';
  const role = profile?.account_status === 'active' ? 'Intern' : 'Not Assigned';
  
  const statusRaw = profile?.account_status || 'inactive';
  const statusLabel = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);
  const statusColor = statusRaw === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';

  const problemStatementName = profile?.problem_statement_title || 'Not Assigned';
  const formattedAdmins = assignedAdmins && assignedAdmins.length > 0
    ? (assignedAdmins.length === 1 ? assignedAdmins[0] : assignedAdmins.length === 2 ? assignedAdmins.join(' & ') : `${assignedAdmins.length} Admins`)
    : 'Not Assigned';
  
  const onboardingRaw = profile?.onboarding_status || 'pending';
  const onboardingLabel = onboardingRaw.charAt(0).toUpperCase() + onboardingRaw.slice(1);

  const joinedDateRaw = profile?.created_at || user?.created_at;
  const joinedDate = joinedDateRaw ? new Date(joinedDateRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not configured';
  
  const startRaw = profile?.internship_start_date || profile?.joining_date || joinedDateRaw;
  const startDate = startRaw ? new Date(startRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not configured';
  const endDate = profile?.internship_end_date ? new Date(profile.internship_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not configured';
  
  // Current Week Calculation
  const startMs = startRaw ? new Date(startRaw).getTime() : null;
  const currentWeek = startMs ? Math.max(1, Math.ceil((Date.now() - startMs) / (1000 * 60 * 60 * 24 * 7))) : null;
  const timeline = currentWeek ? `Week ${currentWeek}` : 'Not Configured';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 👋';
    if (hour < 17) return 'Good Afternoon 👋';
    return 'Good Evening 👋';
  };

  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-widest">Intern Overview</h2>
        <span className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {/* TOP SECTION: Greeting & Profile */}
        <div>
          <h1 className="text-2xl font-bold text-[#0D0D0D] mb-5 tracking-tight">{getGreeting()}</h1>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-lg flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              {userPhoto ? <img src={userPhoto} alt={userName} className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-[#0D0D0D] truncate uppercase tracking-tight leading-none mb-1.5">{userName}</h3>
              <p className="text-sm text-[#737373] truncate">
                {email} <span className="mx-1.5 text-[#EDEDED]">|</span> {mobile}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-[#EDEDED]"></div>

        {/* DETAILS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Problem Statement</p>
            <p className="text-sm font-semibold text-[#0D0D0D] truncate">{problemStatementName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Assigned Admin / Guide</p>
            <p className="text-sm font-semibold text-[#0D0D0D] truncate">{formattedAdmins}</p>
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Account Status</p>
            <p className="text-sm font-semibold text-[#0D0D0D]">{statusLabel}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Onboarding Status</p>
            <p className="text-sm font-semibold text-[#0D0D0D]">{onboardingLabel}</p>
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Internship Period</p>
            <p className="text-sm font-semibold text-[#0D0D0D]">{startDate === 'Not configured' && endDate === 'Not configured' ? 'Not configured' : `${startDate} — ${endDate}`}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Timeline</p>
            <p className="text-sm font-semibold text-[#0D0D0D]">{timeline}</p>
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Joined Date</p>
            <p className="text-sm font-semibold text-[#0D0D0D]">{joinedDate}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Role</p>
            <p className="text-sm font-semibold text-[#0D0D0D]">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
