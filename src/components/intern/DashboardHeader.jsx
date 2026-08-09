import React from 'react';
import { Calendar, User } from 'lucide-react';

/**
 * Section 1 - Header
 * Displays greeting based on local time, profile photo/initials, full name, internship ID, and current date.
 */
export function DashboardHeader({ 
  userName = 'Intern', 
  userPhoto = null, 
  internshipId = 'Not Assigned',
  onboardingStage = null
}) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getInitials = (name) => {
    if (!name) return 'IN';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formattedCurrentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="bg-white border border-[#EDEDED] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
      {/* Left: User Profile & Greeting */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#F7F7F7] border border-[#EDEDED] text-[#FF3D00] flex items-center justify-center font-extrabold text-base sm:text-lg shrink-0 overflow-hidden shadow-xs">
          {userPhoto ? (
            <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <span>{getInitials(userName)}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-[#FF3D00] uppercase tracking-wider">
              {getGreeting()} 👋
            </span>
            {onboardingStage && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FF3D00]/10 text-[#FF3D00] border border-[#FF3D00]/20 rounded-full">
                {onboardingStage}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0D0D0D] tracking-tight truncate mt-0.5">
            {userName}
          </h1>
          <p className="text-xs text-[#737373] font-mono mt-0.5">
            Intern ID: <span className="text-[#0D0D0D] font-bold">{internshipId}</span>
          </p>
        </div>
      </div>

      {/* Right: Date Badge */}
      <div className="shrink-0 flex items-center gap-2 px-3.5 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-semibold text-[#737373]">
        <Calendar className="h-4 w-4 text-[#FF8A00]" />
        <span>{formattedCurrentDate}</span>
      </div>
    </header>
  );
}

