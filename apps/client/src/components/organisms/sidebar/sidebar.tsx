import React, { useMemo, useState } from 'react';
import { SidebarDrawerHeader } from '@/components/molecules';
import { SidebarNav } from './nav';
import { getSidebarNavGroups } from './data';
import { filterNavGroupsByPermission } from '@/lib/nav-permissions';
import { usePermissions } from '@/lib/permissions';
import type { SidebarProps, NavGroup } from '@/types/sidebar';
import { cn } from 'cn';

export interface ExtendedSidebarProps extends SidebarProps {
  navGroups?: NavGroup[];
  className?: string;
}

export const Sidebar: React.FC<ExtendedSidebarProps> = ({
  language = 'en',
  activeNav,
  setActiveNav,
  isMobileOpen,
  setIsMobileOpen,
  onNavigateToRoute,
  navGroups: customNavGroups,
  className,
}) => {
  const [expandedNav, setExpandedNav] = useState<string | null>(null);
  const { has } = usePermissions();

  const navGroups = useMemo(
    () =>
      filterNavGroupsByPermission(
        customNavGroups ?? getSidebarNavGroups(language),
        has,
      ),
    [customNavGroups, language, has],
  );

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-50/80 border-r border-[#e2e8f0] select-none text-[#1e293b] overflow-hidden">
      {/* Mobile Drawer Header (Hidden on Desktop) */}
      <SidebarDrawerHeader
        language={language}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* Scrollable Nav Items */}
      <SidebarNav
        navGroups={navGroups}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        language={language}
        expandedNav={expandedNav}
        setExpandedNav={setExpandedNav}
        onNavigateToRoute={onNavigateToRoute}
        onItemClick={() => setIsMobileOpen(false)}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Non-Collapsible Fixed Height Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 transition-all duration-200 h-[calc(100vh-64px)] sticky top-16 z-20 overflow-hidden w-72',
          className
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sideway Burger Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex animate-in fade-in duration-200">
          <div className="w-[85vw] max-w-xs h-full bg-white shadow-2xl animate-in slide-in-from-left duration-200 overflow-hidden shrink-0">
            {sidebarContent}
          </div>
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close drawer overlay"
          />
        </div>
      )}
    </>
  );
};

export type { SidebarProps };
export default Sidebar;
