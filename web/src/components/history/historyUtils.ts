import type { ClassificationResult } from '../../lib/domain';

/** Clave de día en hora local (YYYY-MM-DD). */
export const dayKey = (d: Date | string): string => {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export function dayLabel(key: string, now = new Date()): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (key === dayKey(now)) return 'Hoy';
  if (key === dayKey(yesterday)) return 'Ayer';
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
}

export interface DayBucket { key: string; short: string; count: number }

/** Conteo de los últimos `days` días (el último es hoy). */
export function lastDays(history: ClassificationResult[], days = 7, now = new Date()): DayBucket[] {
  const counts = new Map<string, number>();
  history.forEach((r) => counts.set(dayKey(r.timestamp), (counts.get(dayKey(r.timestamp)) ?? 0) + 1));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (days - 1 - i));
    const key = dayKey(d);
    return { key, short: d.toLocaleDateString('es', { weekday: 'short' }).replace('.', ''), count: counts.get(key) ?? 0 };
  });
}

export function groupByDay(items: ClassificationResult[]): { key: string; items: ClassificationResult[] }[] {
  const groups: { key: string; items: ClassificationResult[] }[] = [];
  items.forEach((r) => {
    const key = dayKey(r.timestamp);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(r);
    else groups.push({ key, items: [r] });
  });
  return groups;
}
