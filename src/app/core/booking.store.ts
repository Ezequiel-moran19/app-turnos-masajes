
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { DayOption, MissingField } from './models';
import { SITE } from './site.config';
import { availableDays, dateKey, longDate, monthShort, slotsFor, weekdayShort} from './date-utils';

const DURATION_MINUTES = 60;
const PRICE = 25000;

const money = (value: number): string =>
  '$' + value.toLocaleString('es-AR');

const ERRORS: Record<MissingField, string> = {
  date: 'Elegí el día del turno.',
  time: 'Elegí el horario.',
  name: 'Ingresá tu nombre para armar el mensaje.',
};

@Injectable({ providedIn: 'root' })
export class BookingStore {
  readonly name = signal('');
  readonly comments = signal('');

  private readonly dateKeySig = signal<string | null>(null);
  private readonly timeSig = signal<string | null>(null);
  private readonly attempted = signal(false);
  private readonly now = signal(new Date());

  readonly days = computed(() =>
    availableDays(this.now(), DURATION_MINUTES, SITE.schedule),
  );

  readonly selectedDate = computed(
    () =>
      this.days().find((day) => dateKey(day) === this.dateKeySig()) ?? null,
  );

  readonly dayOptions = computed<DayOption[]>(() => {
    const selected = this.selectedDate();

    return this.days().map((day) => ({
      key: dateKey(day),
      weekday: weekdayShort(day),
      day: day.getDate(),
      month: monthShort(day),
      selected:
        selected !== null && dateKey(day) === dateKey(selected),
    }));
  });

  readonly slots = computed(() => {
    const day = this.selectedDate();

    return day
      ? slotsFor(day, this.now(), DURATION_MINUTES, SITE.schedule)
      : [];
  });

  readonly selectedTime = computed(() => {
    const time = this.timeSig();

    return time !== null && this.slots().includes(time) ? time : null;
  });

  readonly selectedDateText = computed(() => {
    const day = this.selectedDate();
    return day ? longDate(day) : '';
  });

  readonly durationText = computed(() => `${DURATION_MINUTES} minutos`);

  readonly price = PRICE;

  readonly priceText = computed(() => money(PRICE));

  readonly missing = computed<MissingField | null>(() => {
    if (!this.selectedDate()) return 'date';
    if (!this.selectedTime()) return 'time';
    if (!this.name().trim()) return 'name';

    return null;
  });

  readonly error = computed(() => {
    const missing = this.missing();
    return this.attempted() && missing !== null ? ERRORS[missing] : '';
  });

  readonly message = computed(() => {
    const day = this.selectedDate();
    const time = this.selectedTime();
    const comments = this.comments().trim();

    const lines = [
      'Hola! Quiero reservar un turno:',
      `• Servicio: Sesión de masajes`,
      `• Duración: ${DURATION_MINUTES} minutos`,
      `• Día: ${day ? longDate(day) : 'a coordinar'}`,
      `• Horario: ${time ? `${time} hs` : 'a coordinar'}`,
      `• Precio: ${money(PRICE)}`,
      `• Nombre: ${this.name().trim() || '—'}`,
    ];

    if (comments) {
      lines.push(`• Comentarios: ${comments}`);
    }

    lines.push('¿Me confirmás el turno?');

    return lines.join('\n');
  });

  readonly whatsappUrl = computed(
    () =>
      `https://wa.me/${SITE.whatsapp.number}?text=${encodeURIComponent(this.message())}`,
  );

  constructor() {
    const intervalId = setInterval(() => {
      this.now.set(new Date());
    }, 60_000);

    inject(DestroyRef).onDestroy(() => clearInterval(intervalId));
  }

  pickDay(key: string): void {
    if (key === this.dateKeySig()) return;

    this.dateKeySig.set(key);
    this.timeSig.set(null);
  }

  pickTime(time: string): void {
    this.timeSig.set(time);
  }

  validate(): MissingField | null {
    const missing = this.missing();
    this.attempted.set(missing !== null);

    return missing;
  }
}
