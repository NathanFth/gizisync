'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendLabel,
  iconColor = 'text-emerald-600',
  iconBg = 'bg-emerald-50 dark:bg-emerald-500/10',
  className,
}: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0;
  return (
    <Card className={cn('group relative overflow-hidden p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5', className)}>
      {/* Decorative gradient blob */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-foreground transition-transform duration-300 group-hover:scale-[1.02] origin-left">{value}</span>
            {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold transition-colors',
                  isPositive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                )}
              >
                {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(trend)}
              </span>
              {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
    </Card>
  );
}
