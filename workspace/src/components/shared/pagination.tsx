'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Menampilkan <span className="font-medium text-foreground">{start}</span>–
        <span className="font-medium text-foreground">{end}</span> dari{' '}
        <span className="font-medium text-foreground">{totalItems}</span> data
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background transition-colors',
            page <= 1
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum = i + 1;
          if (totalPages > 5) {
            if (page > 3) pageNum = page - 2 + i;
            if (page > totalPages - 2) pageNum = totalPages - 4 + i;
          }
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors',
                page === pageNum
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background transition-colors',
            page >= totalPages
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
