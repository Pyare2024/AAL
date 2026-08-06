import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext({
  isCollapsed: false,
  toggleSidebar: () => {},
  setIsCollapsed: () => {},
  isMobileOpen: false,
  toggleMobileMenu: () => {},
  closeMobileMenu: () => {},
});

export function SidebarProvider({ children }) {
  // Initialize collapsed state from localStorage (defaults to false for desktop expanded mode)
  const [isCollapsed, setIsCollapsedState] = useState(() => {
    try {
      const saved = localStorage.getItem('aal_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync isCollapsed changes to localStorage
  const setIsCollapsed = (collapsed) => {
    setIsCollapsedState(collapsed);
    try {
      localStorage.setItem('aal_sidebar_collapsed', JSON.stringify(collapsed));
    } catch (e) {
      console.error('Failed to save sidebar state to localStorage:', e);
    }
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);
  const closeMobileMenu = () => setIsMobileOpen(false);

  // Handle screen resize for tablet auto-collapse & ESC key listener for mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileOpen) {
        closeMobileMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
        setIsCollapsed,
        isMobileOpen,
        toggleMobileMenu,
        closeMobileMenu,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
