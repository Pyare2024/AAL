import React, { useState } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useSidebar } from '../../features/auth/context/SidebarContext';
import { SidebarNavItem } from './SidebarNavItem';
import { 
  Menu, 
  X, 
  LogOut, 
  LayoutDashboard, 
  BriefcaseBusiness, 
  Users, 
  Sparkles, 
  Trophy, 
  Megaphone, 
  MessageSquareText, 
  BookOpen, 
  UserRound, 
  Settings,
  UserCheck,
  FileText,
  CheckSquare,
  Calendar
} from 'lucide-react';

/**
 * Enterprise Fixed Full-Height Sidebar (100dvh flex-col)
 * Structure:
 * - Top Header: AI Apex logo, Intern Portal label, Collapse button
 * - Middle Navigation: flex-1 overflow-y-auto
 * - Bottom Section: mt-auto shrink-0 border-t with profile card & logout button
 */
export function EnterpriseSidebar({ navigationItems = [], isRouteActive }) {
  const { profile, signOut } = useAuth();
  const { isCollapsed, toggleSidebar, isMobileOpen, closeMobileMenu } = useSidebar();
  const [showProfileTooltip, setShowProfileTooltip] = useState(false);
  const [showLogoutTooltip, setShowLogoutTooltip] = useState(false);

  const isOnboardingIncomplete = profile?.onboarding_status !== 'completed';

  const internName = profile?.full_name || 'Intern1';
  const roleLabel = profile?.account_status ? profile.account_status.toUpperCase() : 'INTERN';
  const userPhoto = profile?.profile_photo_url || null;

  const initials = internName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const defaultNavigation = isOnboardingIncomplete
    ? [
        { to: '/onboarding/dashboard', icon: UserCheck, label: 'Onboarding Progress' },
        { to: '/onboarding/profile', icon: UserCheck, label: '1. Profile Completion' },
        { to: '/onboarding/questionnaire', icon: FileText, label: '2. Questionnaire' },
        { to: '/onboarding/learning', icon: BookOpen, label: '3. Learning Setup' },
        { to: '/onboarding/activities', icon: CheckSquare, label: '4. Seven Activities' },
        { to: '/onboarding/interview', icon: Calendar, label: '5. Interview & Allocation' },
      ]
    : [
        { to: '/intern/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/intern/productivity', icon: BriefcaseBusiness, label: 'Productivity' },
        { to: '/intern/community', icon: Users, label: 'Community' },
        { to: '/intern/post-generator', icon: Sparkles, label: 'AI Post Generation' },
        { to: '/intern/leaderboard', icon: Trophy, label: 'Leaderboard' },
        { to: '/intern/announcements', icon: Megaphone, label: 'Announcements' },
        { to: '/intern/feedback', icon: MessageSquareText, label: 'Feedback & Suggestions' },
        { to: '/intern/learning', icon: BookOpen, label: 'Learning' },
        { to: '/intern/profile', icon: UserRound, label: 'Profile' },
        { to: '/intern/settings', icon: Settings, label: 'Settings' },
      ];

  const items = navigationItems.length > 0 ? navigationItems : defaultNavigation;

  const renderSidebarContent = (collapsedMode) => (
    <div className="h-full flex flex-col justify-between">
      {/* TOP SECTION: Header Area */}
      <div className={`p-4 border-b border-[#EDEDED] flex items-center justify-between shrink-0 ${collapsedMode ? 'justify-center px-2' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
            A
          </div>
          {!collapsedMode && (
            <div className="min-w-0">
              <span className="font-bold text-sm text-[#171717] tracking-tight block leading-none truncate">
                AI Apex
              </span>
              <span className="text-[10px] text-[#FF8A00] font-bold uppercase tracking-wider block mt-0.5">
                Intern Portal
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsedMode ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF8A00] hidden md:block"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* MIDDLE SECTION: Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => (
          <SidebarNavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={isRouteActive ? isRouteActive(item.to) : false}
            isCollapsed={collapsedMode}
            onClick={closeMobileMenu}
          />
        ))}
      </nav>

      {/* BOTTOM SECTION: Profile & Logout */}
      <div className="mt-auto shrink-0 border-t border-[#EDEDED] p-3 space-y-2 bg-white">
        {/* Profile Card */}
        <div
          onMouseEnter={() => setShowProfileTooltip(true)}
          onMouseLeave={() => setShowProfileTooltip(false)}
          className={`relative flex items-center gap-2.5 p-2 rounded-xl bg-[#FAFAFA] border border-[#EDEDED] ${
            collapsedMode ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-[#E5E5E5] text-[#171717] font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
            {userPhoto ? <img src={userPhoto} alt={internName} className="w-full h-full object-cover" /> : initials}
          </div>
          {!collapsedMode && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#171717] truncate">{internName}</p>
              <p className="text-[10px] font-semibold text-[#737373] uppercase tracking-wider">{roleLabel}</p>
            </div>
          )}

          {collapsedMode && showProfileTooltip && (
            <div role="tooltip" className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#171717] text-white text-[11px] font-bold rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
              {internName} ({roleLabel})
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#171717] rotate-45" />
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div
          onMouseEnter={() => setShowLogoutTooltip(true)}
          onMouseLeave={() => setShowLogoutTooltip(false)}
          className="relative"
        >
          <button
            type="button"
            onClick={signOut}
            aria-label="Logout"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
              collapsedMode ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-600" />
            {!collapsedMode && <span className="truncate">Logout</span>}
          </button>

          {collapsedMode && showLogoutTooltip && (
            <div role="tooltip" className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#171717] text-white text-[11px] font-bold rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
              Logout
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#171717] rotate-45" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar: Fixed 100dvh */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-[#EDEDED] fixed top-0 left-0 h-dvh transition-all duration-200 ease-in-out shrink-0 z-30 ${
          isCollapsed ? 'w-[72px]' : 'w-[280px]'
        }`}
      >
        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <div className="relative w-[280px] max-w-[80vw] bg-white h-dvh shadow-2xl z-50 flex flex-col">
            <div className="p-3 border-b border-[#EDEDED] flex items-center justify-between">
              <span className="text-xs font-bold text-[#171717]">Navigation Menu</span>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="p-1 rounded-lg text-[#737373] hover:text-[#171717]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderSidebarContent(false)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
