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
  const { isCollapsed, toggleMobileMenu } = useSidebar();

  const isOnboardingRoute = location.pathname.startsWith('/onboarding/');

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
      {/* Render Sidebar ONLY for main intern portal routes, NOT for onboarding routes */}
      {!isOnboardingRoute && <EnterpriseSidebar isRouteActive={isRouteActive} />}

      {/* Main Page Body (No left margin offset when on onboarding routes) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${!isOnboardingRoute ? (isCollapsed ? 'md:ml-[72px]' : 'md:ml-[280px]') : 'ml-0'
        }`}>
        {/* Mobile Header Bar with Hamburger Menu Toggle (Only for non-onboarding routes) */}
        {!isOnboardingRoute && (
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
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function InternLayout() {
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
