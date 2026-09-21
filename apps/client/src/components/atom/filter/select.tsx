import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from 'cn';

export interface FilterSelectOption {
  label: string;
  value: string;
}

export interface FilterSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (val: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className,
  wrapperClassName,
  disabled,
  ...props
}) => {
  return (
    <div className={cn('relative inline-flex items-center', wrapperClassName)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        data-slot="filter-select"
        className={cn(
          'appearance-none bg-white text-slate-700 text-xs font-medium border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d7c90]/20 focus:border-[#0d7c90] cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 pointer-events-none text-slate-400 shrink-0" />
    </div>
  );
};

export default FilterSelect;
