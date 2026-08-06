import React from 'react';
import { Bell } from 'lucide-react';

/**
 * Section 1 - Header
 * Displays greeting based on time, profile photo/initials, full name, internship ID, and notification icon.
 */
export function DashboardHeader({ 
  userName = 'Intern', 
  userPhoto = null, 
  internshipId = 'AAL-INT-0000', 
  unreadNotifications = 0,
  onNotificationClick 
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

  return (
    <header className="bg-white border border-[#EDEDED] rounded-2xl p-4 sm:p-6 shadow-sm flex flex-row justify-between items-center gap-4">
      {/* Left: User Profile & Greeting */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-[#171717] flex items-center justify-center font-bold text-base sm:text-lg shrink-0 overflow-hidden">
          {userPhoto ? (
            <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <span>{getInitials(userName)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#737373] tracking-wide uppercase">
            {getGreeting()} 👋
          </p>
          <h1 className="text-lg sm:text-2xl font-bold text-[#171717] tracking-tight truncate">
            {userName}
          </h1>
          <p className="text-xs text-[#737373] font-mono mt-0.5">
            ID: <span className="text-[#171717] font-semibold">{internshipId}</span>
          </p>
        </div>
      </div>

      {/* Right: Notifications (Hidden until implemented)
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={onNotificationClick}
          className="p-2.5 sm:p-3 rounded-xl border border-[#EDEDED] hover:border-[#D4D4D4] bg-white text-[#404040] hover:text-[#171717] transition-all relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#FF3D00] text-white text-[10px] font-extrabold flex items-center justify-center rounded-full">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>
      </div>
      */}
    </header>
  );
}
