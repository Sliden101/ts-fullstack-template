import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { NavIconBox, NavBadge, Button } from '@/components/atom';
import type { NavItem, SidebarLanguage } from '@/types/sidebar';

const navCardItemVariants = cva(
  'w-full relative flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all text-left border select-none',
  {
    variants: {
      variant: {
        default:
          'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-medium',
        active:
          'bg-white border-[#0d7c90] text-[#0d7c90] shadow-sm font-semibold ring-2 ring-[#0d7c90]/20',
        restricted:
          'bg-amber-50/50 border-amber-200 text-amber-900 hover:bg-amber-100/60',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface NavCardItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof navCardItemVariants> {
  item: NavItem;
  language?: SidebarLanguage;
  isActive?: boolean;
  isExpanded?: boolean;
  onCardClick?: (item: NavItem) => void;
  onToggleExpand?: (item: NavItem, e: React.MouseEvent) => void;
}

export const NavCardItem: React.FC<NavCardItemProps> = ({
  item,
  language = 'en',
  isActive = false,
  isExpanded = false,
  onCardClick,
  onToggleExpand,
  className,
  ...props
}) => {
  const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
  const primaryLabel = language === 'km' ? item.labelAlt : item.label;

  const resolvedVariant = isActive ? 'active' : 'default';

  const handleCardClick = () => {
    onCardClick?.(item);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand?.(item, e);
  };

  return (
    <div
      onClick={handleCardClick}
      title={primaryLabel}
      className={cn(navCardItemVariants({ variant: resolvedVariant, className }))}
      {...props}
    >
      <div className="flex items-center space-x-3.5 truncate">
        <NavIconBox icon={item.icon} isActive={isActive} />

        <div className="truncate">
          <div className="text-sm font-bold tracking-tight text-slate-800 leading-snug truncate">
            {primaryLabel}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 shrink-0 ml-1.5">
        {item.badge && (
          <NavBadge isActive={isActive}>{item.badge}</NavBadge>
        )}

        {hasSubItems && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleToggleClick}
            className={cn(
              'rounded-lg hover:bg-slate-200/70 text-slate-500 transition-transform',
              isExpanded && 'rotate-180 bg-slate-100 text-[#0d7c90]'
            )}
            title="Toggle actions dropdown"
            aria-label="Toggle actions dropdown"
            aria-expanded={isExpanded}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export { navCardItemVariants };
export default NavCardItem;
