import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
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
  ClipboardList
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

const NavItem = ({ to, icon: Icon, label, isActive, isCollapsed }) => (
  <Link
    to={to}
    title={isCollapsed ? label : undefined}
    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white shadow-md shadow-[#FF3D00]/20 font-bold'
        : 'text-[#0D0D0D] hover:bg-[#F7F7F7] hover:text-[#FF8A00]'
    } ${isCollapsed ? 'justify-center px-2' : ''}`}
  >
    <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-[#9A9A9A]'}`} />
    {!isCollapsed && <span className="truncate">{label}</span>}
  </Link>
);

export function InternLayout() {
  const location = useLocation();
  const { profile, onboardingProgress, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isOnboardingIncomplete = profile?.onboarding_status !== 'completed';

  const navigation = isOnboardingIncomplete
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
        { to: '/intern/attendance', icon: Calendar, label: 'Attendance' },
        { to: '/intern/diary', icon: FileText, label: 'Daily Diary' },
        { to: '/intern/learning', icon: BookOpen, label: 'Learning' },
        { to: '/intern/leaderboard', icon: Award, label: 'Leaderboard' },
      ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <header className="bg-white border-b border-[#EDEDED] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] flex items-center justify-center shadow-md shadow-[#FF3D00]/20">
              <span className="text-white font-black text-lg">A</span>
            </div>
            <div>
              <span className="font-bold text-lg text-[#0D0D0D] tracking-tight block leading-none">AI APEX</span>
              <span className="text-xs text-[#FF3D00] font-bold uppercase">
                {isOnboardingIncomplete ? 'ONBOARDING MODE' : 'INTERN PORTAL'}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 rounded-xl text-[#9A9A9A] hover:bg-[#F7F7F7] hover:text-[#0D0D0D] transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF3D00]"></span>
            </button>
            <div className="h-6 w-px bg-[#EDEDED]"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF8A00] to-[#FF3D00] text-white flex items-center justify-center font-bold text-xs">
                IN
              </div>
              <span className="text-sm font-semibold text-[#0D0D0D]">
                {profile?.full_name || 'Intern Account'}
              </span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-sm font-medium text-[#9A9A9A] hover:text-[#FF3D00] px-3 py-2 rounded-xl hover:bg-[#F7F7F7] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#0D0D0D] hover:bg-[#F7F7F7]"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <aside className={`md:block w-64 shrink-0 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm sticky top-24 space-y-1">
            <div className="px-4 py-2 mb-2">
              <p className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">
                {isOnboardingIncomplete ? 'Onboarding Steps' : 'Navigation'}
              </p>
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

export function AdminLayout() {
  const location = useLocation();
  const { signOut } = useAuth();

  const navigation = [
    { to: '/admin/dashboard', icon: ShieldCheck, label: 'Admin Dashboard' },
    { to: '/admin/interns', icon: UserCheck, label: 'Onboarding Interns' },
    { to: '/admin/active-interns', icon: LayoutDashboard, label: 'Active Interns' },
    { to: '/admin/attendance', icon: Calendar, label: 'Attendance Review' },
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
    { to: '/super-admin/engagement', icon: Award, label: 'Engagement' },
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
