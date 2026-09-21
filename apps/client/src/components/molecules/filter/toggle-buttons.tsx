import * as React from 'react';
import { Route as RouteIcon, SlidersHorizontal } from 'lucide-react';
import { cn } from 'cn';
import { IndicatorDot, Button } from '@/components/atom';
import { getTranslation } from '@/i18n';

export interface FilterToggleButtonsProps extends React.HTMLAttributes<HTMLDivElement> {
  isRouteActive?: boolean;
  hasRouteFilter?: boolean;
  onToggleRoute?: () => void;
  routeLabel?: string;

  isFilterActive?: boolean;
  hasActiveFilters?: boolean;
  activeFilterCount?: number;
  onToggleFilter?: () => void;
  filterLabel?: string;

  language?: 'km' | 'en';
}

export const FilterToggleButtons: React.FC<FilterToggleButtonsProps> = ({
  isRouteActive = false,
  hasRouteFilter = false,
  onToggleRoute,
  routeLabel,

  isFilterActive = false,
  hasActiveFilters = false,
  activeFilterCount,
  onToggleFilter,
  filterLabel,

  language = 'en',
  className,
  ...props
}) => {
  const dict = getTranslation(language);
  const defaultRouteLabel = dict.list.route;
  const defaultFilterLabel = dict.list.filters;

  const resolvedRouteLabel = routeLabel ?? defaultRouteLabel;
  const resolvedFilterLabel = filterLabel ?? defaultFilterLabel;

  const showFilterDot = hasActiveFilters || (activeFilterCount !== undefined && activeFilterCount > 0);

  return (
    <div
      data-slot="filter-toggle-buttons"
      className={cn('inline-flex items-center gap-2', className)}
      {...props}
    >
      {/* Route Toggle Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggleRoute}
        aria-pressed={isRouteActive}
        data-slot="route-toggle-button"
        className={cn(
          'relative inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold select-none shadow-2xs',
          isRouteActive
            ? 'border-[#0d7c90] bg-[#0d7c90]/10 text-[#0d7c90] dark:bg-[#0d7c90]/20 dark:text-teal-300 dark:border-[#0d7c90]'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
        )}
      >
        <RouteIcon className="w-3.5 h-3.5 shrink-0" />
        <span>{resolvedRouteLabel}</span>
        {hasRouteFilter && (
          <IndicatorDot
            size="sm"
            colorClass="bg-[#0d7c90] dark:bg-teal-400"
            className="ml-0.5"
          />
        )}
      </Button>

      {/* Advanced Filters Toggle Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggleFilter}
        aria-pressed={isFilterActive}
        data-slot="filter-toggle-button"
        className={cn(
          'relative inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold select-none shadow-2xs',
          isFilterActive
            ? 'border-[#0d7c90] bg-[#0d7c90]/10 text-[#0d7c90] dark:bg-[#0d7c90]/20 dark:text-teal-300 dark:border-[#0d7c90]'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
        )}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
        <span>{resolvedFilterLabel}</span>
        {showFilterDot && (
          <IndicatorDot
            size="sm"
            colorClass="bg-[#0d7c90] dark:bg-teal-400"
            className="ml-0.5"
          />
        )}
        {activeFilterCount !== undefined && activeFilterCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full font-mono text-[10px] font-semibold bg-[#0d7c90] text-white">
            {activeFilterCount}
          </span>
        )}
      </Button>
    </div>
  );
};

export default FilterToggleButtons;
