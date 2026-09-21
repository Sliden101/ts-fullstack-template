import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from 'cn';
import { getTranslation } from '@/i18n';
import { Button } from '@/components/atom';

export interface SearchBarWithClearProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  language?: 'km' | 'en';
  sizeVariant?: 'sm' | 'default' | 'lg';
  wrapperClassName?: string;
}

export const SearchBarWithClear = React.forwardRef<HTMLInputElement, SearchBarWithClearProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder,
      language = 'en',
      sizeVariant = 'default',
      disabled = false,
      className,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const dict = getTranslation(language);
    const defaultPlaceholder = dict.list.searchPlaceholder;
    const clearAriaLabel = dict.list.clearSearch;

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onChange('');
      onClear?.();
      inputRef.current?.focus();
    };

    const sizeStyles = {
      sm: {
        wrapper: 'h-7',
        input: 'text-xs pl-8 pr-7 py-1',
        icon: 'w-3.5 h-3.5 left-2.5',
        clearBtn: 'right-1.5 p-0.5',
        clearIcon: 'w-3 h-3',
      },
      default: {
        wrapper: 'h-8.5',
        input: 'text-xs pl-9 pr-8 py-1.5',
        icon: 'w-4 h-4 left-2.5',
        clearBtn: 'right-2 p-1',
        clearIcon: 'w-3.5 h-3.5',
      },
      lg: {
        wrapper: 'h-10',
        input: 'text-sm pl-10 pr-9 py-2',
        icon: 'w-4.5 h-4.5 left-3',
        clearBtn: 'right-2.5 p-1',
        clearIcon: 'w-4 h-4',
      },
    }[sizeVariant];

    const hasQuery = Boolean(value && value.length > 0);

    return (
      <div
        data-slot="search-bar-with-clear"
        className={cn('relative flex items-center w-full max-w-sm', sizeStyles.wrapper, wrapperClassName)}
      >
        <Search
          className={cn(
            'absolute pointer-events-none text-slate-400 dark:text-slate-500 shrink-0 transition-colors',
            sizeStyles.icon
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? defaultPlaceholder}
          disabled={disabled}
          data-slot="search-bar-input"
          className={cn(
            'w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs transition-colors outline-none focus:border-[#0d7c90] focus:ring-2 focus:ring-[#0d7c90]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800',
            sizeStyles.input,
            className
          )}
          {...props}
        />
        {hasQuery && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleClear}
            aria-label={clearAriaLabel}
            tabIndex={0}
            data-slot="search-bar-clear-button"
            className={cn(
              'absolute flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300',
              sizeStyles.clearBtn
            )}
          >
            <X className={sizeStyles.clearIcon} />
          </Button>
        )}
      </div>
    );
  }
);

SearchBarWithClear.displayName = 'SearchBarWithClear';

export default SearchBarWithClear;
