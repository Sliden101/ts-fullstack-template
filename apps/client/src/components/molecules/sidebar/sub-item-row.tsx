import React from 'react';
import { cn } from 'cn';
import type { SubNavItem, SidebarLanguage } from '@/types/sidebar';

export interface SubNavItemRowProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  item: SubNavItem;
  language?: SidebarLanguage;
  onNavigate?: (item: SubNavItem) => void;
  isActive?: boolean;
}

export const SubNavItemRow: React.FC<SubNavItemRowProps> = ({
  item,
  language = 'en',
  onNavigate,
  isActive = false,
  className,
  onClick,
  ...props
}) => {
  const Icon = item.icon;
  const label = language === 'km' ? item.labelAlt : item.label;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    onNavigate?.(item);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left font-medium cursor-pointer',
        isActive
          ? 'bg-white text-[#0d7c90] shadow-2xs border border-slate-200 font-semibold'
          : 'text-slate-600 hover:text-[#0d7c90] hover:bg-white hover:shadow-2xs border border-transparent hover:border-slate-200',
        className
      )}
      {...props}
    >
      <Icon className="w-3.5 h-3.5 text-[#0d7c90] shrink-0" />
      <div className="truncate">
        <span className="font-semibold">{label}</span>
      </div>
    </button>
  );
};

export default SubNavItemRow;
