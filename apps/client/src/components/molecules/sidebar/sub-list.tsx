import React from 'react';
import { cn } from 'cn';
import type { SubNavItem, SidebarLanguage } from '@/types/sidebar';
import { SubNavItemRow } from './sub-item-row';

export interface SubNavListProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: SubNavItem[];
  language?: SidebarLanguage;
  activeSubNavId?: string;
  onNavigate?: (item: SubNavItem) => void;
  isOpen?: boolean;
}

export const SubNavList: React.FC<SubNavListProps> = ({
  items,
  language = 'km',
  activeSubNavId,
  onNavigate,
  isOpen = true,
  children,
  className,
  ...props
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'ml-4 pl-3 border-l-2 border-[#0d7c90]/30 space-y-1 py-1.5 transition-all animate-in fade-in duration-200',
        className
      )}
      {...props}
    >
      {items
        ? items.map((sub) => (
            <SubNavItemRow
              key={sub.id}
              item={sub}
              language={language}
              isActive={activeSubNavId === sub.id}
              onNavigate={onNavigate}
            />
          ))
        : children}
    </div>
  );
};

export default SubNavList;
