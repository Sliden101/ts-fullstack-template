import React from 'react';
import { X } from 'lucide-react';
import { SidebarBrandLogo, Button } from '@/components/atom';
import { cn } from 'cn';
import type { SidebarLanguage } from '@/types/sidebar';
import { getTranslation } from '@/i18n';

export interface SidebarDrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose: () => void;
  language?: SidebarLanguage;
  title?: string;
  titleAlt?: string;
  subtitle?: string;
}

export const SidebarDrawerHeader: React.FC<SidebarDrawerHeaderProps> = ({
  onClose,
  language = 'en',
  title,
  titleAlt,
  subtitle,
  className,
  ...props
}) => {
  const dict = getTranslation(language);
  const resolvedPrimary =
    (language === 'km' ? titleAlt : title) ?? dict.brand.productName;
  const resolvedSubtitle = subtitle ?? dict.brand.systemTagline;

  return (
    <div
      className={cn(
        'h-14 px-3.5 flex items-center justify-between border-b border-[#e2e8f0] bg-white shrink-0 md:hidden',
        className
      )}
      {...props}
    >
      <div className="flex items-center space-x-3 overflow-hidden">
        <SidebarBrandLogo />
        <div className="truncate">
          <div className="text-xs font-bold text-[#1e293b] tracking-tight leading-tight truncate">
            {resolvedPrimary}
          </div>
          <div className="text-[10px] text-[#0d7c90] font-semibold font-mono tracking-wider">
            {resolvedSubtitle}
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        className="text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-xl"
        title={dict.common.close}
        aria-label={dict.common.close}
      >
        <X className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default SidebarDrawerHeader;
