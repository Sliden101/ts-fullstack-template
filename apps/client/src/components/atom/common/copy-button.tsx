import * as React from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from 'cn';
import { getTranslation } from '@/i18n';

export interface CopyButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  textToCopy: string;
  copiedLabel?: string;
  copyLabel?: string;
  showText?: boolean;
  size?: 'sm' | 'default';
  language?: 'km' | 'en';
  onCopied?: () => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  copiedLabel,
  copyLabel,
  showText = false,
  size = 'default',
  language = 'en',
  onCopied,
  className,
  ...props
}) => {
  const dict = getTranslation(language);
  const resolvedCopyLabel = copyLabel ?? dict.common.copy;
  const resolvedCopiedLabel = copiedLabel ?? dict.common.copied;
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? resolvedCopiedLabel : resolvedCopyLabel}
      title={copied ? resolvedCopiedLabel : resolvedCopyLabel}
      data-slot="copy-button"
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-150 cursor-pointer select-none shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d7c90]/30',
        isSmall ? 'p-1 text-[10px]' : 'p-1.5 text-xs',
        copied && 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
        className
      )}
      {...props}
    >
      {copied ? (
        <Check className={cn('text-emerald-600 dark:text-emerald-400 shrink-0 transition-transform duration-200 scale-110', isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      ) : (
        <Copy className={cn('shrink-0 text-slate-400 dark:text-slate-500', isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      )}
      {showText && (
        <span className={cn('font-medium', copied && 'text-emerald-600 dark:text-emerald-400 font-semibold')}>
          {copied ? resolvedCopiedLabel : resolvedCopyLabel}
        </span>
      )}
    </button>
  );
};

export default CopyButton;
