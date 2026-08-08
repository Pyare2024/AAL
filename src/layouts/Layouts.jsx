import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { SidebarProvider, useSidebar } from '../features/auth/context/SidebarContext';
import { EnterpriseSidebar } from '../components/common/EnterpriseSidebar';
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
  Sparkles,
  Settings,
  MessageSquareText,
  Megaphone,
  Trophy
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

function InternLayoutContent() {
  const location = useLocation();
  const { isCollapsed, toggleMobileMenu } = useSidebar();

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
    <div className="min-h-screen bg-[#F7F7F7] flex">
      {/* Fixed Full-Height Sidebar */}
      <EnterpriseSidebar isRouteActive={isRouteActive} />

      {/* Main Page Body (Offset by sidebar width on desktop) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
        isCollapsed ? 'md:ml-[72px]' : 'md:ml-[280px]'
      }`}>
        {/* Mobile Header Bar with Hamburger Menu Toggle */}
        <header className="md:hidden bg-white border-b border-[#EDEDED] p-3 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
            <span className="font-bold text-sm text-[#171717]">AI Apex</span>
          </div>
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label="Open Navigation Menu"
            className="p-2 rounded-lg text-[#171717] hover:bg-[#F5F5F5]"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function InternLayout() {
  return (
    <SidebarProvider>
      <InternLayoutContent />
    </SidebarProvider>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const { signOut } = useAuth();

  const navigation = [
    { to: '/admin/dashboard', icon: ShieldCheck, label: 'Admin Dashboard' },
    { to: '/admin/interns', icon: UserCheck, label: 'Onboarding Interns' },
    { to: '/admin/active-interns', icon: LayoutDashboard, label: 'Active Interns' },
    { to: '/admin/productivity', icon: Award, label: 'Productivity' },
    { to: '/admin/attendance', icon: Calendar, label: 'Attendance Review' },
    { to: '/admin/daily-diary', icon: FileText, label: 'Daily Diary Review' },
    { to: '/admin/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/admin/community', icon: Users, label: 'Community' },
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/admin/feedback', icon: MessageSquareText, label: 'Feedback & Suggestions' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <header className="bg-white border-b border-[#EDEDED] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] flex items-center justify-center shadow-md shadow-[#FF3D00]/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#0D0D0D] tracking-tight block leading-none">AI APEX</span>
              <span className="text-xs text-[#FF8A00] font-bold">ADMIN CONSOLE</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-[#0D0D0D]">Admin Portal</span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-sm font-medium text-[#9A9A9A] hover:text-[#FF3D00] px-3 py-2 rounded-xl hover:bg-[#F7F7F7] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <aside className="w-64 shrink-0 hidden md:block">
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm sticky top-24 space-y-1">
            <div className="px-4 py-2 mb-2">
              <p className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Admin Tools</p>
            </div>
            {navigation.map((item) => (
              <NavItem 
                key={item.to} 
                {...item} 
                isActive={location.pathname === item.to}
              />
            ))}
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function SuperAdminLayout() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Main Sidebar Navigation Modules ONLY (Submodules displayed as cards inside content area)
  const navigation = [
    { to: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/super-admin/onboarding', icon: UserCheck, label: 'Onboarding Management' },
    { to: '/super-admin/questionnaire-management', icon: ClipboardList, label: 'Questionnaire Management' },
    { to: '/super-admin/interns', icon: Users, label: 'Intern Management' },
    { to: '/super-admin/learning', icon: BookOpen, label: 'Learning Management' },
    { to: '/super-admin/operations', icon: Calendar, label: 'Operations' },
    { to: '/super-admin/productivity', icon: Award, label: 'Productivity' },
    { to: '/super-admin/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/super-admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/super-admin/community', icon: Users, label: 'Community' },
    { to: '/super-admin/feedback', icon: MessageSquareText, label: 'Feedback & Suggestions' },
    { to: '/super-admin/problem-statements', icon: FileText, label: 'Problem Statement Management' },
    { to: '/super-admin/admins', icon: ShieldCheck, label: 'Admin Management' },
    { to: '/super-admin/reports', icon: TrendingUp, label: 'Reports & Analytics' },
    { to: '/super-admin/profile', icon: User, label: 'Profile' },
    { to: '/super-admin/settings', icon: Sliders, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <header className="bg-white border-b border-[#EDEDED] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] flex items-center justify-center shadow-md shadow-[#FF3D00]/20">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#0D0D0D] tracking-tight block leading-none">AI APEX</span>
              <span className="text-xs text-[#FF3D00] font-extrabold uppercase">SUPER ADMIN CONSOLE</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-[#0D0D0D]">Super Admin</span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-sm font-medium text-[#9A9A9A] hover:text-[#FF3D00] px-3 py-2 rounded-xl hover:bg-[#F7F7F7] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        {/* Collapsible Super Admin Sidebar - Main Modules Only */}
        <aside 
          className={`shrink-0 hidden md:block transition-all duration-300 ${
            isSidebarCollapsed ? 'w-20' : 'w-[280px]'
          }`}
        >
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm sticky top-24 space-y-1 max-h-[calc(100vh-120px)] overflow-y-auto relative group">
            <div className="flex items-center justify-between px-2 py-1.5 mb-1">
              {!isSidebarCollapsed ? (
                <p className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">SUPER CONTROL</p>
              ) : (
                <p className="text-[10px] font-bold text-[#FF3D00] uppercase tracking-tighter mx-auto">SC</p>
              )}

              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                className="p-1.5 rounded-lg bg-[#F7F7F7] hover:bg-[#FF8A00]/10 hover:text-[#FF8A00] text-[#9A9A9A] border border-[#EDEDED] transition-all ml-auto"
              >
                {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>

            {navigation.map((item) => {
              const isCurrentActive = location.pathname === item.to || (item.to !== '/super-admin/dashboard' && location.pathname.startsWith(item.to));
              return (
                <NavItem 
                  key={item.to} 
                  {...item} 
                  isCollapsed={isSidebarCollapsed}
                  isActive={isCurrentActive}
                />
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
