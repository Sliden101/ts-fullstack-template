import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const countBadgeVariants = cva(
  'inline-flex items-center gap-1 font-medium rounded-full border transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        primary:
          'bg-[#0d7c90]/10 text-[#0d7c90] border-[#0d7c90]/20 dark:bg-[#0d7c90]/20 dark:text-teal-400 dark:border-[#0d7c90]/30',
        secondary:
          'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700',
        success:
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
        warning:
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
        danger:
          'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
        info:
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
        muted:
          'bg-transparent text-slate-500 border-slate-200 dark:text-slate-400 dark:border-slate-700',
      },
      size: {
        default: 'px-2 py-0.5 text-xs',
        sm: 'px-1.5 py-0.5 text-[10px]',
        lg: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface CountBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof countBadgeVariants> {
  count: number;
  label?: string;
  formatNumber?: boolean;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  label,
  formatNumber = true,
  variant,
  size,
  className,
  children,
  ...props
}) => {
  const formattedCount = formatNumber ? count.toLocaleString() : count;

  return (
    <span
      data-slot="count-badge"
      className={cn(countBadgeVariants({ variant, size, className }))}
      {...props}
    >
      <span className="font-mono font-semibold">{formattedCount}</span>
      {label && <span className="text-[0.9em] opacity-80">{label}</span>}
      {children}
    </span>
  );
};

export { countBadgeVariants };
export default CountBadge;
