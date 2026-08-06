import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Navigation Item with Tooltip for Collapsed Mode
 * - Orange background for active item (#FF8A00) with small left indicator bar
 * - Light orange hover background (#FFF7ED / #FF8A00 opacity)
 * - Accessible keyboard focus states & ARIA tooltips
 */
export function SidebarNavItem({ to, icon: Icon, label, isActive, isCollapsed, onClick }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative group">
      <Link
        to={to}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label={label}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF8A00] ${
          isActive
            ? 'bg-[#FF8A00] text-white font-bold shadow-sm'
            : 'text-[#404040] hover:bg-[#FFF7ED] hover:text-[#FF8A00]'
        } ${isCollapsed ? 'justify-center px-2' : ''}`}
      >
        {/* Left Orange Active Indicator Bar */}
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r-full" />
        )}

        <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[#737373] group-hover:text-[#FF8A00]'}`} />

        {!isCollapsed && (
          <span className="truncate text-xs tracking-tight transition-opacity duration-200">
            {label}
          </span>
        )}
      </Link>

      {/* Accessible Floating Tooltip in Collapsed Mode */}
      {isCollapsed && showTooltip && (
        <div
          role="tooltip"
          className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#171717] text-white text-[11px] font-bold rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none animate-fadeIn"
        >
          {label}
          {/* Tooltip Arrow */}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#171717] rotate-45" />
        </div>
      )}
    </div>
  );
}
