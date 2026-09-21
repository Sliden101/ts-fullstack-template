import React, { useState } from 'react';
import { NavGroupTitle } from '@/components/atom';
import { NavCardItem, SubNavList } from '@/components/molecules';
import { cn } from 'cn';
import type { NavGroup, NavItem, SubNavItem, SidebarLanguage } from '@/types/sidebar';

export interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  navGroups: NavGroup[];
  activeNav: string;
  setActiveNav: (nav: string) => void;
  language?: SidebarLanguage;
  expandedNav?: string | null;
  setExpandedNav?: (nav: string | null) => void;
  onNavigateToRoute?: (path: string) => void;
  onItemClick?: (item: { id: string; path: string }) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  navGroups,
  activeNav,
  setActiveNav,
  language = 'en',
  expandedNav: controlledExpandedNav,
  setExpandedNav: controlledSetExpandedNav,
  onNavigateToRoute,
  onItemClick,
  className,
  ...props
}) => {
  const [internalExpandedNav, setInternalExpandedNav] = useState<string | null>(null);

  const isControlled = controlledSetExpandedNav !== undefined;
  const currentExpanded = isControlled ? controlledExpandedNav : internalExpandedNav;
  const updateExpanded = isControlled ? controlledSetExpandedNav : setInternalExpandedNav;

  const handleItemSelect = (item: { id: string; path: string }) => {
    if (onNavigateToRoute) {
      onNavigateToRoute(item.path);
    } else {
      setActiveNav(item.id);
    }
    onItemClick?.(item);
  };

  const handleCardClick = (item: NavItem) => {
    const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
    if (hasSubItems) {
      updateExpanded?.(currentExpanded === item.id ? null : item.id);
    }

    handleItemSelect(item);
  };

  const handleToggleExpand = (item: NavItem, e: React.MouseEvent) => {
    e.stopPropagation();
    updateExpanded?.(currentExpanded === item.id ? null : item.id);
  };

  const handleSubItemClick = (parentItem: NavItem, sub: SubNavItem) => {
    handleItemSelect({ id: parentItem.id, path: sub.path });
  };

  return (
    <div
      className={cn('flex-1 overflow-y-auto min-h-0 scrollbar-thin', className)}
      {...props}
    >
      <nav className="p-3.5 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <NavGroupTitle>{group.title}</NavGroupTitle>

            <div className="grid grid-cols-1 gap-2">
              {group.items.map((item) => {
                const isActive = activeNav === item.id || activeNav.startsWith(item.id);
                const isDropdownOpen = currentExpanded === item.id;
                const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);

                return (
                  <div key={item.id} className="space-y-1">
                    <NavCardItem
                      item={item}
                      language={language}
                      isActive={isActive}
                      isExpanded={isDropdownOpen}
                      onCardClick={handleCardClick}
                      onToggleExpand={handleToggleExpand}
                    />

                    {/* Expandable Dropdown Actions Submenu */}
                    {isDropdownOpen && hasSubItems && (
                      <SubNavList
                        isOpen={true}
                        items={item.subItems}
                        language={language}
                        activeSubNavId={activeNav}
                        onNavigate={(sub) => handleSubItemClick(item, sub)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default SidebarNav;
