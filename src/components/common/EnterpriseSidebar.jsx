import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useSidebar } from '../../features/auth/context/SidebarContext';
import { SidebarNavItem as NavItem } from './SidebarNavItem';
import { LogOut, ChevronLeft, ChevronRight, X } from 'lucide-react';

export function EnterpriseSidebar({ 
  portalName, 
  roleColor, 
  roleLabel, 
  roleIcon: RoleIcon, 
  navigationGroups, 
  isRouteActive 
}) {
  const { isCollapsed, toggleSidebar, isMobileOpen, toggleMobileMenu } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-[#EDEDED] flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-[72px]' : 'w-[280px]'
      } md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Sidebar Header */}
      <div className="h-[72px] flex items-center px-4 border-b border-[#EDEDED] shrink-0">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${roleColor} flex items-center justify-center shadow-lg shrink-0`}>
          {RoleIcon && <RoleIcon className="h-5 w-5 text-white" />}
        </div>
        {!isCollapsed && (
          <div className="ml-3 flex-1 min-w-0">
            <h1 className="font-extrabold text-[#0D0D0D] text-lg tracking-tight truncate">{portalName}</h1>
            <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider">{roleLabel}</p>
          </div>
        )}
        <button onClick={toggleSidebar} className="hidden md:flex ml-auto p-1.5 rounded-lg text-[#9A9A9A] hover:bg-[#F5F5F5]">
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button onClick={toggleMobileMenu} className="md:hidden ml-auto p-1.5 rounded-lg text-[#9A9A9A] hover:bg-[#F5F5F5]">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <nav className="px-3 space-y-6">
          {navigationGroups.map((group, idx) => (
            <div key={idx}>
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-extrabold text-[#9A9A9A] uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={isRouteActive(item.to)}
                    isCollapsed={isCollapsed}
                    onClick={() => { if (window.innerWidth < 768) toggleMobileMenu(); }}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#EDEDED] shrink-0">
        <NavItem
          to="/login"
          icon={LogOut}
          label="Sign Out"
          isActive={false}
          isCollapsed={isCollapsed}
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
}
