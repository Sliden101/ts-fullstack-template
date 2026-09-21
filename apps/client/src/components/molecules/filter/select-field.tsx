import * as React from 'react';
import { cn } from 'cn';
import { Label, FilterSelect, type FilterSelectOption } from '@/components/atom';

export interface FilterSelectFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  wrapperClassName?: string;
}

export const FilterSelectField: React.FC<FilterSelectFieldProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  orientation = 'vertical',
  className,
  labelClassName,
  selectClassName,
  wrapperClassName,
}) => {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;

  return (
    <div
      data-slot="filter-select-field"
      className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col gap-1.5' : 'items-center gap-2.5',
        className
      )}
    >
      <Label
        htmlFor={selectId}
        className={cn(
          'text-[10px] font-semibold text-slate-500 uppercase tracking-wider select-none shrink-0',
          labelClassName
        )}
      >
        {label}
      </Label>
      <FilterSelect
        id={selectId}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        className={selectClassName}
        wrapperClassName={wrapperClassName}
      />
    </div>
  );
};

export default FilterSelectField;
