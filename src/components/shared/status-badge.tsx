'use client';

import { cn } from '@/lib/utils';
import type { StatusGizi, StatusAlert, StatusIbuHamil, StatusLaporan } from '@/lib/data/types';

type BadgeVariant = 'normal' | 'warning' | 'critical' | 'info' | 'success' | 'neutral';

const variantStyles: Record<BadgeVariant, string> = {
  normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-600/20',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-600/20',
  critical: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 ring-red-600/20',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 ring-sky-600/20',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-600/20',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400 ring-gray-600/20',
};

const statusGiziMap: Record<StatusGizi, { variant: BadgeVariant; dot: string }> = {
  'Normal': { variant: 'normal', dot: 'bg-emerald-500' },
  'Stunting': { variant: 'warning', dot: 'bg-amber-500' },
  'Severely Stunting': { variant: 'critical', dot: 'bg-red-500' },
  'Wasting': { variant: 'warning', dot: 'bg-amber-500' },
  'Severely Wasting': { variant: 'critical', dot: 'bg-red-500' },
  'Gizi Lebih': { variant: 'info', dot: 'bg-sky-500' },
  'Obesitas': { variant: 'critical', dot: 'bg-red-500' },
  'Risiko Gizi Lebih': { variant: 'info', dot: 'bg-sky-500' },
  'Di luar rentang WHO': { variant: 'neutral', dot: 'bg-gray-400' },
};

const statusAlertMap: Record<StatusAlert, BadgeVariant> = {
  Warning: 'warning',
  Critical: 'critical',
};

const statusIbuMap: Record<StatusIbuHamil, BadgeVariant> = {
  Normal: 'normal',
  'Risiko KEK': 'critical',
};

const statusLaporanMap: Record<StatusLaporan, BadgeVariant> = {
  Normal: 'normal',
  'Perlu Tindakan': 'warning',
};

interface StatusBadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ children, variant = 'neutral', dot = false, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantStyles[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', variantStyles[variant].match(/text-(\w+)-/)?.[1] ? `bg-current` : 'bg-gray-400')} />}
      {children}
    </span>
  );
}

export function GiziStatusBadge({ status }: { status: StatusGizi }) {
  const config = statusGiziMap[status] ?? { variant: 'neutral' as BadgeVariant };
  return (
    <StatusBadge variant={config.variant} dot>
      {status}
    </StatusBadge>
  );
}

export function AlertStatusBadge({ status }: { status: StatusAlert }) {
  return (
    <StatusBadge variant={statusAlertMap[status]} dot>
      {status}
    </StatusBadge>
  );
}

export function IbuHamilStatusBadge({ status }: { status: StatusIbuHamil }) {
  return (
    <StatusBadge variant={statusIbuMap[status]} dot>
      {status}
    </StatusBadge>
  );
}

export function LaporanStatusBadge({ status }: { status: StatusLaporan }) {
  return (
    <StatusBadge variant={statusLaporanMap[status]} dot>
      {status}
    </StatusBadge>
  );
}
