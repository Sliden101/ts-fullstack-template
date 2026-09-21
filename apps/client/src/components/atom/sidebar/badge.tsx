import React from 'react';
import { Lock } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const navBadgeVariants = cva(
  'inline-flex items-center font-mono font-bold rounded-lg border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-600 border-slate-200 text-xs',
        active: 'bg-[#0d7c90]/10 text-[#0d7c90] border-[#0d7c90]/20 text-xs',
        restricted: 'bg-amber-200/80 text-amber-900 border-amber-300 text-[10px]',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]',
        currency: 'bg-sky-50 text-sky-700 border-sky-200 text-[10px]',
      },
      size: {
        default: 'px-2 py-0.5',
        sm: 'px-1.5 py-0.5 text-[10px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface NavBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof navBadgeVariants> {
  isActive?: boolean;
  isRestricted?: boolean;
  showLockIcon?: boolean;
}

export const NavBadge: React.FC<NavBadgeProps> = ({
  children,
  variant,
  size,
  isActive = false,
  isRestricted = false,
  showLockIcon,
  className,
  ...props
}) => {
  const resolvedVariant =
    variant ?? (isRestricted ? 'restricted' : isActive ? 'active' : 'default');

  const shouldShowLock =
    showLockIcon ?? (resolvedVariant === 'restricted' || isRestricted);

  const displayContent = children ?? (resolvedVariant === 'restricted' ? '403' : null);

  if (!displayContent && !shouldShowLock) {
    return null;
  }

  return (
    <span
      className={cn(navBadgeVariants({ variant: resolvedVariant, size, className }))}
      {...props}
    >
      {shouldShowLock && <Lock className="w-3 h-3 mr-1 shrink-0" />}
      {displayContent}
    </span>
  );
};

export { navBadgeVariants };
export default NavBadge;
