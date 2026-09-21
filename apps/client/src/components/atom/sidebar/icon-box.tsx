import React from 'react';
import { Lock, type LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const navIconBoxVariants = cva(
  'flex items-center justify-center shrink-0 transition-colors',
  {
    variants: {
      variant: {
        default: 'text-slate-500',
        active: 'text-[#0d7c90]',
        restricted: 'text-amber-700',
      },
      size: {
        default: 'w-5 h-5',
        sm: 'w-4 h-4',
        lg: 'w-6 h-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type NavIconBoxVariant = 'default' | 'active' | 'restricted';

export interface NavIconBoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof navIconBoxVariants> {
  icon: LucideIcon;
  state?: NavIconBoxVariant;
  isActive?: boolean;
  isRestricted?: boolean;
  iconClassName?: string;
}

export const NavIconBox: React.FC<NavIconBoxProps> = ({
  icon: Icon,
  variant,
  state,
  size = 'default',
  isActive = false,
  isRestricted = false,
  className,
  iconClassName,
  ...props
}) => {
  const resolvedVariant =
    variant ?? state ?? (isRestricted ? 'restricted' : isActive ? 'active' : 'default');

  return (
    <div
      className={cn(navIconBoxVariants({ variant: resolvedVariant, size, className }))}
      {...props}
    >
      {resolvedVariant === 'restricted' ? (
        <Lock className={cn('w-full h-full', iconClassName)} />
      ) : (
        <Icon className={cn('w-full h-full', iconClassName)} />
      )}
    </div>
  );
};

export { navIconBoxVariants };
export default NavIconBox;
