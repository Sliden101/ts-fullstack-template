import * as React from 'react';
import { cn } from 'cn';

export interface ModalBackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  children?: React.ReactNode;
  blur?: boolean;
}

export const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  onClose,
  children,
  blur = true,
  className,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      data-slot="modal-backdrop"
      onClick={handleClick}
      role="presentation"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 transition-all duration-200 animate-in fade-in',
        blur && 'backdrop-blur-xs',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default ModalBackdrop;
