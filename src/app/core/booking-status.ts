import { BookingRecord } from './models';

export type BookingStatus = BookingRecord['status'];

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
};

export function todayISO(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD en hora local
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export function hhmm(time: string): string {
  return time.slice(0, 5);
}

/** Verificá el formato con un número real tuyo antes de usarlo en producción. */
export function whatsappLink(phone: string, text = ''): string {
  let digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('54')) digits = '549' + digits.replace(/^0/, '');
  return `https://wa.me/${digits}${text ? '?text=' + encodeURIComponent(text) : ''}`;
}