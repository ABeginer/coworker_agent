import { createElement, type ReactNode } from 'react';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import type { TaskStatus } from '@/types/task';

export interface StatusConfig {
  label: string;
  badgeClass: string;
  icon: ReactNode;
}

/**
 * Single source of truth for status badges.
 * Icons are built with createElement so this module stays a .ts file.
 */
export const STATUS_CONFIGS: Record<TaskStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    icon: createElement(Clock, { className: 'w-3.5 h-3.5' }),
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 animate-pulse',
    icon: createElement(Loader2, { className: 'w-3.5 h-3.5 animate-spin' }),
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    icon: createElement(CheckCircle2, { className: 'w-3.5 h-3.5' }),
  },
  failed: {
    label: 'Failed',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    icon: createElement(XCircle, { className: 'w-3.5 h-3.5' }),
  },
};

export const UNKNOWN_DATE = 'Unknown date';

/** Locale date/time for a Postgres timestamptz string; never renders "Invalid Date". */
export function formatTaskDate(dateString: string): string {
  if (!dateString) return UNKNOWN_DATE;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return UNKNOWN_DATE;

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Deterministic badge config: unknown/nullish runtime status falls back to 'pending'. */
export function getStatusBadgeConfig(status: TaskStatus): StatusConfig {
  return STATUS_CONFIGS[status] ?? STATUS_CONFIGS.pending;
}

/**
 * True when an id is an integer that round-trips through a JS number (<= 2^53-1).
 * `"42"` and `42` are both safe; `"9007199254740993"` and `""` are not.
 */
export function isBigIntSafe(id: string | number): boolean {
  if (typeof id === 'number') return Number.isSafeInteger(id);

  const trimmed = String(id).trim();
  if (trimmed === '') return false;

  return Number.isSafeInteger(Number(trimmed));
}
