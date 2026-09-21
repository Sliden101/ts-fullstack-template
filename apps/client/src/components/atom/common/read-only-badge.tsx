import * as React from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from 'cn';
import { getTranslation } from '@/i18n';

export interface ReadOnlyBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string;
  language?: 'km' | 'en';
  size?: 'sm' | 'default';
}

export const ReadOnlyBadge: React.FC<ReadOnlyBadgeProps> = ({
  label,
  language = 'en',
  size = 'default',
  className,
  ...props
}) => {
  const dict = getTranslation(language);
  const defaultLabel = dict.list.readOnlyLocked;
  const resolvedLabel = label ?? defaultLabel;

  return (
    <span
      data-slot="read-only-badge"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold select-none shadow-2xs transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
      {...props}
    >
      <ShieldAlert className={cn('shrink-0 text-amber-600 dark:text-amber-400', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      <span>{resolvedLabel}</span>
    </span>
  );
};

export default ReadOnlyBadge;
