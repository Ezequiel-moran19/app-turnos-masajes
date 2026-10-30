import { ScheduleConfig } from './models';

const pad = (n: number): string => String(n).padStart(2, '0');

const weekdayFmt = new Intl.DateTimeFormat('es-AR', { weekday: 'short' });
const monthFmt = new Intl.DateTimeFormat('es-AR', { month: 'short' });
const longFmt = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

export const dateKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const weekdayShort = (d: Date): string => weekdayFmt.format(d).replace('.', '');
export const monthShort = (d: Date): string => monthFmt.format(d).replace('.', '');
export const longDate = (d: Date): string => longFmt.format(d);

const toMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
const toTime = (m: number): string => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** Horarios de inicio posibles para un día, según la duración de la sesión. */
export function slotsFor(day: Date, now: Date, minutes: number, cfg: ScheduleConfig): string[] {
  const out: string[] = [];
  const today = dateKey(day) === dateKey(now);
  const earliest = now.getHours() * 60 + now.getMinutes() + cfg.leadMinutes;
  for (let t = toMinutes(cfg.open); t + minutes <= toMinutes(cfg.close); t += cfg.stepMinutes) {
    if (!today || t >= earliest) out.push(toTime(t));
  }
  return out;
}

/** Próximos días de atención que todavía tienen algún horario. */
export function availableDays(now: Date, minutes: number, cfg: ScheduleConfig): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < cfg.horizonDays; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12);
    if (cfg.days.includes(d.getDay()) && slotsFor(d, now, minutes, cfg).length > 0) out.push(d);
  }
  return out;
}
