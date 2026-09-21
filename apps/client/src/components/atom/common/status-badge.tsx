import * as React from 'react';
import { cn } from 'cn';
import { IndicatorDot } from './indicator-dot';
import { getTranslation } from '@/i18n';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'active' | 'suspended' | 'pending' | 'inactive' | string;
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'default' | 'lg';
  language?: 'km' | 'en';
}

const statusVariants: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
    defaultEn: string;
    defaultKm: string;
  }
> = {
  active: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
    defaultEn: 'Active',
    defaultKm: 'សកម្ម',
  },
  suspended: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800/60',
    dot: 'bg-rose-500',
    defaultEn: 'Suspended',
    defaultKm: 'ផ្អាក',
  },
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/60',
    dot: 'bg-amber-500',
    defaultEn: 'Pending',
    defaultKm: 'រង់ចាំ',
  },
  inactive: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
    defaultEn: 'Inactive',
    defaultKm: 'អសកម្ម',
  },
};

const sizeStyles = {
  sm: 'px-1.5 py-0.2 text-[9px] gap-1',
  default: 'px-2 py-0.5 text-[10px] gap-1.5',
  lg: 'px-2.5 py-1 text-xs gap-1.5',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showDot = true,
  size = 'default',
  language = 'en',
  className,
  ...props
}) => {
  const dict = getTranslation(language);
  const normalizedKey = status.toLowerCase();
  const config =
    statusVariants[normalizedKey] ?? {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400',
      defaultEn: status,
      defaultKm: status,
    };

  const translatedStatus = (dict.status as Record<string, string>)[normalizedKey];
  const resolvedLabel = label ?? translatedStatus ?? (language === 'km' ? config.defaultKm : config.defaultEn);

  return (
    <span
      data-slot="status-badge"
      className={cn(
        'inline-flex items-center font-semibold rounded-full border select-none transition-colors shadow-2xs',
        config.bg,
        config.text,
        config.border,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {showDot && <IndicatorDot size="xs" colorClass={config.dot} />}
      <span>{resolvedLabel}</span>
    </span>
  );
};

export default StatusBadge;
