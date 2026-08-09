import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { SidebarProvider, useSidebar } from '../features/auth/context/SidebarContext';
import { SidebarNavItem as NavItem } from '../components/common/SidebarNavItem';
import { 
  LogOut, 
  LayoutDashboard, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  BookOpen, 
  CheckSquare, 
  Calendar, 
  Award, 
  Bell, 
  Menu, 
  X, 
  FileText,
  Users,
  TrendingUp,
  User,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Briefcase,
  BriefcaseBusiness,
  Sparkles,
  Settings,
  MessageSquareText,
  Megaphone,
  Trophy,
  UserRound
} from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-[#EDEDED]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] flex items-center justify-center shadow-lg shadow-[#FF3D00]/25 mb-3">
            <span className="text-white font-extrabold text-2xl tracking-wider">APEX</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">AI Apex Launchpad</h1>
          <p className="text-sm text-[#9A9A9A] mt-1 font-medium">Internship Provider & Management System</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// SHARED DASHBOARD LAYOUT
// ------------------------------------------------------------------

function SharedDashboardLayout({ portalName, roleColor, roleLabel, roleIcon: RoleIcon, navigationGroups, isRouteActiveFunc }) {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  
  // Collapse State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(`${portalName.toLowerCase().replace(/\s+/g, '-')}SidebarCollapsed`);
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  // Mobile Drawer State
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem(`${portalName.toLowerCase().replace(/\s+/g, '-')}SidebarCollapsed`, JSON.stringify(newState));
      return newState;
    });
  };

  const closeMobileMenu = () => setIsMobileOpen(false);
  const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

  const isRouteActive = isRouteActiveFunc || ((itemTo) => {
    if (itemTo === `/${portalName.toLowerCase().replace(/\s+/g, '-')}/dashboard`) return location.pathname === itemTo;
    return location.pathname === itemTo || location.pathname.startsWith(itemTo);
  });

  const renderSidebarContent = (collapsed) => (
    <div className="h-full flex flex-col relative bg-white">
      {/* Top: Logo & Portal Identity */}
      <div className={`h-[72px] flex items-center px-4 shrink-0 border-b border-[#EDEDED] ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${roleColor} flex items-center justify-center shadow-md shrink-0`}>
            <RoleIcon className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-lg text-[#0D0D0D] tracking-tight block leading-none truncate">AI APEX</span>
              <span className={`text-[10px] ${roleColor.includes('FF3D00') && roleColor.includes('from-[#FF3D00]') ? 'text-[#FF3D00]' : 'text-[#FF8A00]'} font-extrabold uppercase tracking-wider block mt-0.5 truncate`}>
                {portalName}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle (Inside sidebar header) */}
        {!isMobileOpen && (
          <button
            onClick={toggleSidebar}
            className={`hidden md:flex p-1.5 text-[#9A9A9A] hover:bg-[#F7F7F7] hover:text-[#FF8A00] rounded-lg transition-colors ${
              collapsed ? 'absolute -right-3.5 top-5 bg-white border border-[#EDEDED] shadow-sm z-50' : ''
            }`}
            aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Middle: Navigation */}
      <div className={`flex-1 overflow-y-auto p-4 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#EDEDED] scrollbar-track-transparent ${collapsed ? 'items-center' : ''}`}>
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="w-full">
            {!collapsed && group.title ? (
              <p className="px-3 text-[10px] font-bold text-[#9A9A9A] uppercase tracking-widest mb-2">{group.title}</p>
            ) : (
               group.title && <div className="w-full h-px bg-[#EDEDED] my-2" />
            )}
            <div className="flex flex-col space-y-1 w-full">
              {group.items.map((item) => (
                <NavItem 
                  key={item.to} 
                  {...item} 
                  isActive={isRouteActive(item.to)}
                  isCollapsed={collapsed}
                  onClick={closeMobileMenu}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex">
      {/* Desktop Full-Height Sidebar */}
      <aside className={`hidden md:block shrink-0 h-screen sticky top-0 border-r border-[#EDEDED] transition-all duration-300 ease-in-out z-40 ${isSidebarCollapsed ? 'w-[76px]' : 'w-[260px]'}`}>
        {renderSidebarContent(isSidebarCollapsed)}
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
            <div className="absolute top-4 right-4 z-50">
              <button
                type="button"
                onClick={closeMobileMenu}
                className="p-1.5 rounded-lg bg-white/80 text-[#737373] hover:text-[#171717] backdrop-blur-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderSidebarContent(false)}
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Right-Side Global Header */}
        <header className="bg-white border-b border-[#EDEDED] sticky top-0 z-30 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] h-[72px] shrink-0">
          <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            
            <div className="flex items-center">
              {/* Mobile Menu Toggle (Only visible on small screens) */}
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="md:hidden p-2 -ml-2 mr-2 rounded-lg text-[#171717] hover:bg-[#F5F5F5]"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              {/* Optional page context can go here, but prompt wants it clean */}
              <div className="hidden md:block">
                <span className="text-sm font-semibold text-[#0D0D0D]">{roleLabel}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-bold text-[#0D0D0D] leading-none">{profile?.full_name || 'User'}</span>
                <span className="text-xs text-[#9A9A9A] font-medium mt-1">{roleLabel}</span>
              </div>
              <div className="h-8 w-px bg-[#EDEDED] mx-1 hidden sm:block"></div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-sm font-medium text-[#9A9A9A] hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors group"
                title="Logout"
              >
                <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
        
        {/* Page Content Container */}
        <main className="flex-1 overflow-x-hidden p-6 lg:p-8">
          <div className="max-w-[1600px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// INTERN LAYOUT
// ------------------------------------------------------------------

export function InternLayout() {
  const { profile } = useAuth();
  const isOnboardingIncomplete = profile?.onboarding_status !== 'completed';
  const location = useLocation();

  const internNavigation = isOnboardingIncomplete
    ? [
        {
          title: 'Onboarding',
          items: [
            { to: '/onboarding/dashboard', icon: UserCheck, label: 'Onboarding Progress' },
            { to: '/onboarding/profile', icon: UserCheck, label: '1. Profile Completion' },
            { to: '/onboarding/questionnaire', icon: FileText, label: '2. Questionnaire' },
            { to: '/onboarding/learning', icon: BookOpen, label: '3. Learning Setup' },
            { to: '/onboarding/activities', icon: CheckSquare, label: '4. Seven Activities' },
            { to: '/onboarding/interview', icon: Calendar, label: '5. Interview & Allocation' },
          ]
        }
      ]
    : [
        {
          title: 'Overview',
          items: [
            { to: '/intern/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          ]
        },
        {
          title: 'Work & Engagement',
          items: [
            { to: '/intern/productivity', icon: BriefcaseBusiness, label: 'Productivity' },
            { to: '/intern/community', icon: Users, label: 'Community' },
            { to: '/intern/post-generator', icon: Sparkles, label: 'AI Post Generation' },
            { to: '/intern/leaderboard', icon: Trophy, label: 'Leaderboard' },
            { to: '/intern/announcements', icon: Megaphone, label: 'Announcements' },
            { to: '/intern/feedback', icon: MessageSquareText, label: 'Feedback & Suggestions' },
            { to: '/intern/learning', icon: BookOpen, label: 'Learning' },
          ]
        },
        {
          title: 'Account',
          items: [
            { to: '/intern/profile', icon: UserRound, label: 'Profile' },
            { to: '/intern/settings', icon: Settings, label: 'Settings' },
          ]
        }
      ];

  const isRouteActive = (itemTo) => {
    const current = location.pathname;
    if (itemTo === '/intern/dashboard') return current === '/intern/dashboard';
    if (itemTo === '/intern/productivity') {
      return ['/intern/productivity', '/intern/attendance', '/intern/todo', '/intern/diary', '/intern/pending-work'].some(path => current.startsWith(path));
    }
    if (itemTo === '/intern/community') return current.startsWith('/intern/community');
    if (itemTo === '/intern/post-generator') return current.startsWith('/intern/post-generator') || current.startsWith('/intern/ai-post-generator');
    if (itemTo === '/intern/leaderboard') return current.startsWith('/intern/leaderboard');
    if (itemTo === '/intern/announcements') return current.startsWith('/intern/announcements');
    if (itemTo === '/intern/feedback') return current.startsWith('/intern/feedback');
    if (itemTo === '/intern/learning') return current.startsWith('/intern/learning');
    if (itemTo === '/intern/profile') return current.startsWith('/intern/profile');
    if (itemTo === '/intern/settings') return current.startsWith('/intern/settings');
    return current === itemTo;
  };

  return (
    <SidebarProvider>
      <SharedDashboardLayout 
        portalName="Intern Portal"
        roleColor="from-[#FF8A00] to-[#FF3D00]"
        roleLabel="Intern"
        roleIcon={UserRound}
        navigationGroups={internNavigation}
        isRouteActiveFunc={isRouteActive}
      />
    </SidebarProvider>
  );
}

// ------------------------------------------------------------------
// ADMIN LAYOUT
// ------------------------------------------------------------------

export function AdminLayout() {
  const adminNavigation = [
    {
      title: 'Overview',
      items: [
        { to: '/admin/dashboard', icon: ShieldCheck, label: 'Admin Dashboard' },
      ]
    },
    {
      title: 'Intern Management',
      items: [
        { to: '/admin/interns', icon: UserCheck, label: 'Onboarding Interns' },
        { to: '/admin/active-interns', icon: LayoutDashboard, label: 'Active Interns' },
        { to: '/admin/attendance', icon: Calendar, label: 'Attendance Review' },
      ]
    },
    {
      title: 'Engagement',
      items: [
        { to: '/admin/leaderboard', icon: Trophy, label: 'Leaderboard' },
        { to: '/admin/community', icon: Users, label: 'Community' },
        { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
        { to: '/admin/feedback', icon: MessageSquareText, label: 'Feedback & Suggestions' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { to: '/admin/reports', icon: TrendingUp, label: 'Reports & Analytics' },
        { to: '/admin/profile', icon: User, label: 'Profile' },
        { to: '/admin/settings', icon: Sliders, label: 'Settings' },
      ]
    }
  ];

  const location = useLocation();
  const isRouteActive = (itemTo) => location.pathname === itemTo;

  return (
    <SharedDashboardLayout 
      portalName="Admin Console"
      roleColor="from-[#FF8A00] to-[#FF3D00]"
      roleLabel="Admin Portal"
      roleIcon={ShieldCheck}
      navigationGroups={adminNavigation}
      isRouteActiveFunc={isRouteActive}
    />
  );
}

// ------------------------------------------------------------------
// SUPER ADMIN LAYOUT
// ------------------------------------------------------------------

export function SuperAdminLayout() {
  const location = useLocation();

  const superAdminNavigation = [
    {
      title: 'Super Control',
      items: [
        { to: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]
    },
    {
      title: 'Core Management',
      items: [
        { to: '/super-admin/onboarding', icon: UserCheck, label: 'Onboarding Management' },
        { to: '/super-admin/questionnaire-management', icon: ClipboardList, label: 'Questionnaire Management' },
        { to: '/super-admin/interns', icon: Users, label: 'Intern Management' },
        { to: '/super-admin/learning', icon: BookOpen, label: 'Learning Management' },
        { to: '/super-admin/operations', icon: Calendar, label: 'Operations' },
      ]
    },
    {
      title: 'Engagement',
      items: [
        { to: '/super-admin/engagement', icon: Award, label: 'Engagement' },
        { to: '/super-admin/leaderboard', icon: Trophy, label: 'Leaderboard' },
        { to: '/super-admin/announcements', icon: Megaphone, label: 'Announcements' },
        { to: '/super-admin/community', icon: Users, label: 'Community' },
        { to: '/super-admin/feedback', icon: MessageSquareText, label: 'Feedback & Suggestions' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { to: '/super-admin/problem-statements', icon: FileText, label: 'Problem Statement Management' },
        { to: '/super-admin/admins', icon: ShieldCheck, label: 'Admin Management' },
        { to: '/super-admin/reports', icon: TrendingUp, label: 'Reports & Analytics' },
        { to: '/super-admin/profile', icon: User, label: 'Profile' },
        { to: '/super-admin/settings', icon: Sliders, label: 'Settings' },
      ]
    }
  ];

  const isRouteActive = (itemTo) => {
    if (itemTo === '/super-admin/dashboard') return location.pathname === itemTo;
    return location.pathname === itemTo || location.pathname.startsWith(itemTo);
  };

  return (
    <SharedDashboardLayout 
      portalName="Super Admin Console"
      roleColor="from-[#FF8A00] to-[#FF3D00]" 
      roleLabel="Super Admin"
      roleIcon={ShieldAlert}
      navigationGroups={superAdminNavigation}
      isRouteActiveFunc={isRouteActive}
    />
  );
}
