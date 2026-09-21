import type { ComponentProps } from 'react';
import { cn } from 'cn';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/atom/common/button';

function Pagination({ className, ...props }: ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: ComponentProps<'ul'>) {
  return (
    <ul
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: ComponentProps<'li'>) {
  return <li {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & ComponentProps<typeof Button>;

function PaginationLink({
  className,
  isActive,
  size = 'icon-sm',
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      aria-current={isActive ? 'page' : undefined}
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      className={cn(
        'cursor-pointer',
        isActive && 'pointer-events-none',
        className
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      aria-label="Go to previous page"
      variant="ghost"
      size="sm"
      className={cn('gap-1 pl-2.5 cursor-pointer', className)}
      {...props}
    >
      <ChevronLeft className="w-4 h-4" />
      <span>Prev</span>
    </Button>
  );
}

function PaginationNext({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      aria-label="Go to next page"
      variant="ghost"
      size="sm"
      className={cn('gap-1 pr-2.5 cursor-pointer', className)}
      {...props}
    >
      <span>Next</span>
      <ChevronRight className="w-4 h-4" />
    </Button>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex h-7 w-7 items-center justify-center text-slate-400', className)}
      {...props}
    >
      <MoreHorizontal className="w-4 h-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
