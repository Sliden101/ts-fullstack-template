import React from 'react';
import { Package, type LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const sidebarBrandLogoVariants = cva(
  'bg-[#0d7c90] text-white flex items-center justify-center shrink-0 shadow-xs font-bold transition-colors',
  {
    variants: {
      size: {
        default: 'w-8 h-8 rounded-xl',
        sm: 'w-7 h-7 rounded-lg',
        lg: 'w-10 h-10 rounded-2xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const logoIconSizeMap = {
  sm: 'w-3.5 h-3.5',
  default: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export interface SidebarBrandLogoProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarBrandLogoVariants> {
  icon?: LucideIcon;
  iconClassName?: string;
}

export const SidebarBrandLogo: React.FC<SidebarBrandLogoProps> = ({
  icon: Icon = Package,
  size = 'default',
  className,
  iconClassName,
  ...props
}) => {
  const resolvedSize = size ?? 'default';
  const defaultIconSize = logoIconSizeMap[resolvedSize] ?? 'w-4 h-4';

  return (
    <div
      className={cn(sidebarBrandLogoVariants({ size, className }))}
      {...props}
    >
      <Icon className={cn(defaultIconSize, iconClassName)} />
    </div>
  );
};

export { sidebarBrandLogoVariants };
export default SidebarBrandLogo;
