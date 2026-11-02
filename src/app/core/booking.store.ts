import { computed, inject, Injectable, signal } from '@angular/core';
import { BookingService } from './services/booking.service';
import { ScheduleService } from './services/schedule.service';
import { DayOption, MissingField, ScheduleExceptionRecord, WeeklyScheduleRecord,} from './models';
import { CONTACTS } from './site.config';
import { BookingAccessService } from './services/booking-access.service';

const HORIZON_DAYS = 14;
const LEAD_MINUTES = 120;

// Configuración temporal del turno general.
const BOOKING_PRICE = 25000;
const BOOKING_DURATION_MINUTES = 60;

const pad = (n: number): string => String(n).padStart(2, '0');

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromISO(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

function addMinutes(time: string, minutes: number): string {
  const total =
    Number(time.slice(0, 2)) * 60 +
    Number(time.slice(3, 5)) +
    minutes;

  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

@Injectable({ providedIn: 'root' })
export class BookingStore {
  private readonly bookings = inject(BookingService);
  private readonly schedule = inject(ScheduleService);
  private readonly bookingAccess = inject(BookingAccessService);
  private readonly privateBookingUrl = signal('');

  readonly name = signal('');
  readonly phone = signal('');
  readonly comments = signal('');
  readonly error = signal('');
  readonly loading = signal(true);

  readonly selectedDate = signal<string | null>(null);
  readonly selectedTime = signal<string | null>(null);

  private readonly weekly = signal<WeeklyScheduleRecord[]>([]);
  private readonly exceptions = signal<ScheduleExceptionRecord[]>([]);
  private readonly taken = signal<string[]>([]);
  private readonly availabilityFailed = signal(false);

  readonly priceText = computed( () => '$' + BOOKING_PRICE.toLocaleString('es-AR') );

  readonly dayOptions = computed<DayOption[]>(() => {
    const selected = this.selectedDate();
    const base = new Date();
    base.setHours(0, 0, 0, 0);

    const options: DayOption[] = [];

    for (let i = 0; i <= HORIZON_DAYS; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);

      const key = toISO(d);

      if (this.slotsFor(key).length === 0) continue;

      options.push({
        key,
        weekday: d.toLocaleDateString('es-AR', {
          weekday: 'short',
        }).replace('.', ''),
        day: d.getDate(),
        month: d.toLocaleDateString('es-AR', {
          month: 'short',
        }).replace('.', ''),
        selected: key === selected,
      });
    }

    return options;
  });

  readonly slots = computed<string[]>(() => {
    const date = this.selectedDate();

    if (!date || this.availabilityFailed()) return [];

    const taken = this.taken();

    return this.slotsFor(date).filter((time) => !taken.includes(time));
  });

  readonly selectedDateText = computed(() => {
    const key = this.selectedDate();

    if (!key) return '';

    const text = fromISO(key).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    return text.charAt(0).toUpperCase() + text.slice(1);
  });

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      const [weekly, exceptions] = await Promise.all([
        this.schedule.getWeekly(),
        this.schedule.getExceptions(),
      ]);

      this.weekly.set(weekly);
      this.exceptions.set(exceptions);
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los datos para reservar.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  private slotsFor(key: string): string[] {
    const exception = this.exceptions().find(
      (e) => e.exception_date === key,
    );

    let slots: string[];

    if (exception) {
      slots = exception.closed ? [] : exception.slots;
    } else {
      const day = this.weekly().find(
        (w) => w.weekday === fromISO(key).getDay(),
      );

      slots = day?.enabled ? day.slots : [];
    }

    const limit = Date.now() + LEAD_MINUTES * 60_000;

    return [...slots]
      .sort()
      .filter(
        (time) =>
          new Date(`${key}T${time}:00`).getTime() > limit,
      );
  }

  async pickDay(key: string): Promise<void> {
    this.selectedDate.set(key);
    this.selectedTime.set(null);
    this.taken.set([]);
    this.availabilityFailed.set(false);
    this.error.set('');

    try {
      const taken = await this.bookings.takenSlots(key);

      if (this.selectedDate() === key) {
        this.taken.set(taken);
      }
    } catch {
      if (this.selectedDate() === key) {
        this.availabilityFailed.set(true);
        this.error.set(
          'No se pudo consultar la disponibilidad. Probá nuevamente.',
        );
      }
    }
  }

  pickTime(time: string): void {
    this.selectedTime.set(time);
    this.error.set('');
  }

  validate(): MissingField | null {
    let missing: MissingField | null = null;
    let message = '';

    if (!this.selectedDate()) {
      missing = 'date';
      message = 'Elegí un día.';
    } else if (!this.selectedTime()) {
      missing = 'time';
      message = 'Elegí un horario.';
    } else if (this.availabilityFailed()) {
      message =
        'No se pudo verificar la disponibilidad. Elegí nuevamente el día.';
    } else if (this.name().trim().length < 2) {
      missing = 'name';
      message = 'Ingresá tu nombre.';
    } else if (this.phone().replace(/\D/g, '').length < 8) {
      missing = 'phone';
      message = 'Ingresá un teléfono válido.';
    }

    this.error.set(message);

    return missing;
  }

  async submit(): Promise<void> {
    const date = this.selectedDate();
    const time = this.selectedTime();

    if (!date || !time) {
      throw new Error('Faltan datos para realizar la reserva.');
    }

    if (this.availabilityFailed()) {
      throw new Error('No se pudo verificar la disponibilidad.');
    }

    // Generar token privado y su hash.
    const { token, hash } = await this.bookingAccess.createToken();

    // Crear reserva y guardar el hash en una única operación SQL.
    await this.bookings.create({
      customer_name: this.name().trim(),
      customer_phone: this.phone().trim(),
      service_id: null,
      booking_date: date,
      start_time: time,
      end_time: addMinutes(time, BOOKING_DURATION_MINUTES),
      notes: this.comments().trim(),
      token_hash: hash,
    });

    // Conservar el enlace para incluirlo en WhatsApp.
    this.privateBookingUrl.set(
      this.bookingAccess.getAccessUrl(token),
    );

    this.taken.update((times) => [...times, time]);
  }

  reset(): void {
    this.name.set('');
    this.phone.set('');
    this.comments.set('');
    this.error.set('');
    this.selectedTime.set(null);
    this.privateBookingUrl.set('');
  }

  whatsappUrl(): string {
    const lines = [
      'Hola! Quiero reservar un turno de masajes.',
      `Día: ${this.selectedDateText() || '—'}`,
      `Horario: ${this.selectedTime() ? this.selectedTime() + ' hs' : '—'}`,
      `Precio: ${this.priceText()}`,
      `Nombre: ${this.name().trim() || '—'}`,
      `Teléfono: ${this.phone().trim() || '—'}`,
      '',
      'Podés consultar el estado de tu turno o cancelarlo desde este enlace:',
      this.privateBookingUrl(),
    ];

    const comments = this.comments().trim();

    if (comments) {
      lines.splice(6, 0, `Comentarios: ${comments}`);
    }

    return `https://wa.me/${this.whatsappNumber()}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  private whatsappNumber(): string {
    const contact = CONTACTS.find( (item) => item.icon === 'whatsapp' );
    const href = contact?.href ?? '';
    const match = href.match(/wa\.me\/(\d+)/);
    return match ? match[1] : (contact?.value ?? '').replace(/\D/g, '');
  }
}