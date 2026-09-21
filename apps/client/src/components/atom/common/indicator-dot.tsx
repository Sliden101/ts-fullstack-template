import * as React from 'react';
import { cn } from 'cn';

export interface IndicatorDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  colorClass?: string;
  size?: 'xs' | 'sm' | 'default' | 'md' | 'lg';
}

const sizeClasses = {
  xs: 'w-1 h-1',
  sm: 'w-1.5 h-1.5',
  default: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export const IndicatorDot: React.FC<IndicatorDotProps> = ({
  colorClass = 'bg-[#0d7c90]',
  size = 'default',
  className,
  ...props
}) => {
  return (
    <span
      data-slot="indicator-dot"
      className={cn(
        'inline-block rounded-full shrink-0',
        sizeClasses[size],
        colorClass,
        className
      )}
      {...props}
    />
  );
};

export default IndicatorDot;
