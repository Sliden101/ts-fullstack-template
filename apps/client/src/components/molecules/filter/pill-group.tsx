import * as React from 'react';
import { cn } from 'cn';
import { FilterPill, type FilterPillActiveVariant } from '@/components/atom';

export interface FilterPillOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  activeVariant?: FilterPillActiveVariant;
}

export interface FilterPillGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: FilterPillOption[];
  value: string;
  onChange: (value: string) => void;
  activeVariant?: FilterPillActiveVariant;
  size?: 'sm' | 'default' | 'lg';
  label?: string;
  scrollable?: boolean;
}

export const FilterPillGroup: React.FC<FilterPillGroupProps> = ({
  options,
  value,
  onChange,
  activeVariant = 'dark',
  size = 'default',
  label,
  scrollable = true,
  className,
  ...props
}) => {
  return (
    <div
      data-slot="filter-pill-group"
      className={cn(
        'flex items-center gap-2',
        scrollable &&
          'overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      {...props}
    >
      {label && (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0 select-none mr-0.5">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1.5 shrink-0">
        {options.map((option) => {
          const isSelected = option.value === value;
          const variant = option.activeVariant ?? activeVariant;

          return (
            <FilterPill
              key={option.value}
              label={option.label}
              count={option.count}
              icon={option.icon}
              isActive={isSelected}
              onClick={() => onChange(option.value)}
              activeVariant={variant}
              size={size}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FilterPillGroup;
