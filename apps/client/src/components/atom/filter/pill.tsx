import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

export type FilterPillActiveVariant = 'dark' | 'teal';

const filterPillVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-full border text-xs font-medium cursor-pointer select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      activeVariant: {
        dark: '',
        teal: '',
      },
      isActive: {
        true: '',
        false:
          'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100 shadow-2xs',
      },
      size: {
        sm: 'h-6 px-2.5 text-[11px]',
        default: 'h-7 px-3 text-xs',
        lg: 'h-8 px-4 text-sm',
      },
    },
    compoundVariants: [
      {
        isActive: true,
        activeVariant: 'dark',
        className:
          'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-xs dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 dark:hover:bg-slate-200',
      },
      {
        isActive: true,
        activeVariant: 'teal',
        className:
          'bg-[#0d7c90] text-white border-[#0d7c90] hover:bg-[#0a6b7d] shadow-xs dark:bg-[#0d7c90] dark:text-white dark:border-[#0d7c90] dark:hover:bg-[#0a6b7d]',
      },
    ],
    defaultVariants: {
      activeVariant: 'dark',
      isActive: false,
      size: 'default',
    },
  }
);

export interface FilterPillProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>,
    VariantProps<typeof filterPillVariants> {
  label: string;
  isActive: boolean;
  onClick: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  activeVariant?: FilterPillActiveVariant;
  count?: number;
  icon?: React.ReactNode;
}

export const FilterPill: React.FC<FilterPillProps> = ({
  label,
  isActive,
  onClick,
  activeVariant = 'dark',
  count,
  icon,
  size = 'default',
  className,
  type = 'button',
  children,
  ...props
}) => {
  return (
    <button
      type={type}
      data-slot="filter-pill"
      data-active={isActive ? 'true' : 'false'}
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        filterPillVariants({
          activeVariant,
          isActive,
          size,
          className,
        })
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'ml-0.5 px-1.5 py-0.2 rounded-full font-mono text-[10px] font-semibold transition-colors',
            isActive
              ? activeVariant === 'teal'
                ? 'bg-white/20 text-white'
                : 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          )}
        >
          {count}
        </span>
      )}
      {children}
    </button>
  );
};

export { filterPillVariants };
export default FilterPill;
