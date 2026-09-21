import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from 'cn';
import { getTranslation } from '@/i18n';
import { Button } from '@/components/atom';

export interface FilterSummaryBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  filteredCount: number;
  totalCount: number;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
  entityName?: string;
  clearLabel?: string;
  language?: 'km' | 'en';
}

export const FilterSummaryBanner: React.FC<FilterSummaryBannerProps> = ({
  filteredCount,
  totalCount,
  onClearAll,
  hasActiveFilters,
  entityName,
  clearLabel,
  language = 'en',
  className,
  ...props
}) => {
  const dict = getTranslation(language);
  const isFiltered = hasActiveFilters ?? filteredCount !== totalCount;

  const defaultEntity = dict.list.countLabel;
  const resolvedEntity = entityName ?? defaultEntity;

  const defaultClearLabel = dict.list.clearAllFilters;
  const resolvedClearLabel = clearLabel ?? defaultClearLabel;

  return (
    <div
      data-slot="filter-summary-banner"
      className={cn(
        'flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5 font-normal">
        <span>
          {dict.list.showing}{' '}
          <strong className="font-semibold text-slate-900 dark:text-white font-mono">
            {filteredCount.toLocaleString()}
          </strong>{' '}
          {dict.common.of}{' '}
          <strong className="font-semibold text-slate-900 dark:text-white font-mono">
            {totalCount.toLocaleString()}
          </strong>{' '}
          {resolvedEntity}
        </span>
      </div>

      {isFiltered && onClearAll && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          data-slot="filter-summary-clear-button"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d7c90] hover:text-[#0a6b7d] dark:text-teal-400 dark:hover:text-teal-300 select-none"
        >
          <RotateCcw className="w-3 h-3 shrink-0" />
          <span>{resolvedClearLabel}</span>
        </Button>
      )}
    </div>
  );
};

export default FilterSummaryBanner;
