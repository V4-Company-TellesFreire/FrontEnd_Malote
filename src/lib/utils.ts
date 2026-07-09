import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNowStrict, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TimeAlertLevel } from './constants';
import { TIME_ALERT_THRESHOLDS } from './constants';

/**
 * Merges Tailwind classes with conflict resolution.
 * Usage: cn('bg-red-500', condition && 'bg-blue-500')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Date Formatters ────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '—';
  }
}

export function formatTime(isoStr: string): string {
  if (!isoStr) return '—';
  try {
    return format(new Date(isoStr), 'HH:mm', { locale: ptBR });
  } catch {
    return '—';
  }
}

export function formatDateTime(isoStr: string): string {
  if (!isoStr) return '—';
  try {
    return format(new Date(isoStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return '—';
  }
}

export function elapsed(isoStr: string): string {
  if (!isoStr) return '—';
  try {
    return formatDistanceToNowStrict(new Date(isoStr), { locale: ptBR, addSuffix: false });
  } catch {
    return '—';
  }
}

export function elapsedMinutes(isoStr: string): number {
  if (!isoStr) return 0;
  try {
    return differenceInMinutes(new Date(), new Date(isoStr));
  } catch {
    return 0;
  }
}

// ─── Time Alert Level ───────────────────────────────────────────────────────

export function getTimeAlertLevel(isoStr: string): TimeAlertLevel {
  const minutes = elapsedMinutes(isoStr);
  if (minutes < TIME_ALERT_THRESHOLDS.normal) return 'normal';
  if (minutes < TIME_ALERT_THRESHOLDS.attention) return 'attention';
  return 'critical';
}

// ─── OS Number Generator ────────────────────────────────────────────────────

let osCounter = 0;

export function generateOSNumber(): string {
  osCounter++;
  const date = format(new Date(), 'yyMMdd');
  return `OC${date}-${String(osCounter).padStart(4, '0')}`;
}

export function resetOSCounter(value: number = 0): void {
  osCounter = value;
}

// ─── Phone Formatter ────────────────────────────────────────────────────────

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// ─── Prescription Summary ───────────────────────────────────────────────────

export function prescriptionSummary(rx: { od?: { esf?: string; cil?: string; eixo?: string }; oe?: { esf?: string; cil?: string; eixo?: string } } | null): string {
  if (!rx?.od) return '—';
  const od = [rx.od.esf, rx.od.cil, rx.od.eixo].filter(Boolean).join('/');
  const oe = [rx.oe?.esf, rx.oe?.cil, rx.oe?.eixo].filter(Boolean).join('/');
  const parts = [od && `OD: ${od}`, oe && `OE: ${oe}`].filter(Boolean);
  return parts.length > 0 ? parts.join(' | ') : '—';
}

// ─── Unique ID ──────────────────────────────────────────────────────────────

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
