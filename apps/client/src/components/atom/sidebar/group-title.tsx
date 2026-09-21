import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const navGroupTitleVariants = cva(
  'text-[11px] font-extrabold uppercase tracking-[0.08em] select-none transition-colors',
  {
    variants: {
      variant: {
        default: 'text-[#64748b]',
        muted: 'text-slate-400',
        primary: 'text-[#0d7c90]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface NavGroupTitleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof navGroupTitleVariants> {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const NavGroupTitle: React.FC<NavGroupTitleProps> = ({
  children,
  variant,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-1 flex items-center justify-between',
        navGroupTitleVariants({ variant, className })
      )}
      {...props}
    >
      <span>{children}</span>
      {action && <div>{action}</div>}
    </div>
  );
};

export { navGroupTitleVariants };
export default NavGroupTitle;
