import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScheduleExceptionRecord, WeeklyScheduleRecord } from '../../core/models';
import { ScheduleService } from '../../core/services/schedule.service';
import { formatDate } from '../../core/booking-status';

const SLOT_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Orden de visualización: lunes a domingo (0 = domingo en JS). */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function parseSlots(raw: string): { slots: string[]; invalid: string[] } {
  const parts = raw.split(',').map((x) => x.trim()).filter(Boolean);
  const invalid = parts.filter((p) => !SLOT_RE.test(p));
  const slots = [...new Set(parts.filter((p) => SLOT_RE.test(p)))].sort();
  return { slots, invalid };
}

@Component({
  selector: 'app-schedule',
  imports: [FormsModule],
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Schedule implements OnInit {
  private readonly service = inject(ScheduleService);

  protected readonly formatDate = formatDate;

  readonly days = signal<WeeklyScheduleRecord[]>([]);
  readonly exceptions = signal<ScheduleExceptionRecord[]>([]);
  readonly error = signal('');
  readonly message = signal('');
  readonly saving = signal(false);

  readonly dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  /** Texto editable de horarios por día (weekday -> "09:00, 10:00"). */
  slotsText: Record<number, string> = {};

  genStart = '09:00';
  genEnd = '18:00';
  genStep = 60;

  exceptionDate = '';
  exceptionSlots = '';
  exceptionClosed = false;
  exceptionNote = '';

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      const [stored, exceptions] = await Promise.all([
        this.service.getWeekly(),
        this.service.getExceptions(),
      ]);

      // Siempre se muestran los 7 días, aunque la tabla esté vacía.
      const days: WeeklyScheduleRecord[] = WEEK_ORDER.map((weekday) => {
        const found = stored.find((d) => d.weekday === weekday);
        return {
          weekday,
          enabled: found?.enabled ?? false,
          slots: found?.slots ?? [],
        };
      });

      const text: Record<number, string> = {};
      for (const d of days) text[d.weekday] = d.slots.join(', ');

      this.slotsText = text;
      this.days.set(days);
      this.exceptions.set(exceptions);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los horarios.');
    }
  }

  setEnabled(weekday: number, enabled: boolean): void {
    this.days.update((rows) => rows.map((r) => (r.weekday === weekday ? { ...r, enabled } : r)));
  }

  /** Genera los horarios a partir del rango Desde / Hasta / Cada. */
  private buildSlots(): string[] | null {
    const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    const toStr = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

    if (!SLOT_RE.test(this.genStart) || !SLOT_RE.test(this.genEnd)) {
      this.error.set('Completá hora de inicio y de fin.');
      return null;
    }
    if (!this.genStep || this.genStep < 5) {
      this.error.set('El intervalo mínimo es de 5 minutos.');
      return null;
    }
    if (toMin(this.genEnd) <= toMin(this.genStart)) {
      this.error.set('La hora de fin debe ser posterior a la de inicio.');
      return null;
    }

    const slots: string[] = [];
    for (let m = toMin(this.genStart); m < toMin(this.genEnd); m += this.genStep) {
      slots.push(toStr(m));
    }
    return slots;
  }

  fillDay(weekday: number): void {
    this.error.set('');
    const slots = this.buildSlots();
    if (!slots) return;

    this.slotsText[weekday] = slots.join(', ');
    this.setEnabled(weekday, true);
  }

  /** Aplica el rango generado a lunes–sábado. */
  applyToWorkdays(): void {
    this.error.set('');
    const slots = this.buildSlots();
    if (!slots) return;

    for (const weekday of [1, 2, 3, 4, 5, 6]) {
      this.slotsText[weekday] = slots.join(', ');
      this.setEnabled(weekday, true);
    }
    this.message.set('Rango aplicado de lunes a sábado. Revisá y tocá "Guardar toda la semana".');
  }

  private collect(day: WeeklyScheduleRecord): WeeklyScheduleRecord | null {
    const name = this.dayNames[day.weekday];
    const { slots, invalid } = parseSlots(this.slotsText[day.weekday] ?? '');

    if (invalid.length) {
      this.error.set(`${name}: horarios inválidos (${invalid.join(', ')}). Usá formato HH:mm.`);
      return null;
    }
    if (day.enabled && slots.length === 0) {
      this.error.set(`${name} está habilitado pero no tiene horarios.`);
      return null;
    }

    return { weekday: day.weekday, enabled: day.enabled, slots };
  }

  async saveDay(day: WeeklyScheduleRecord): Promise<void> {
    this.error.set('');
    this.message.set('');

    const row = this.collect(day);
    if (!row) return;

    this.saving.set(true);
    try {
      await this.service.saveWeekly(row);
      this.message.set(`Horario de ${this.dayNames[day.weekday]} guardado.`);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      this.saving.set(false);
    }
  }

  async saveAll(): Promise<void> {
    this.error.set('');
    this.message.set('');

    const rows: WeeklyScheduleRecord[] = [];
    for (const day of this.days()) {
      const row = this.collect(day);
      if (!row) return;
      rows.push(row);
    }

    this.saving.set(true);
    try {
      await this.service.saveWeeklyMany(rows);
      this.message.set('Semana guardada.');
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo guardar la semana.');
    } finally {
      this.saving.set(false);
    }
  }

  useRangeInException(): void {
    this.error.set('');
    const slots = this.buildSlots();
    if (!slots) return;

    this.exceptionClosed = false;
    this.exceptionSlots = slots.join(', ');
  }

  async addException(): Promise<void> {
    this.error.set('');
    this.message.set('');

    if (!this.exceptionDate) {
      this.error.set('Elegí una fecha.');
      return;
    }

    const { slots, invalid } = parseSlots(this.exceptionSlots);
    if (invalid.length) {
      this.error.set(`Horarios inválidos: ${invalid.join(', ')}. Usá formato HH:mm.`);
      return;
    }
    if (!this.exceptionClosed && slots.length === 0) {
      this.error.set('Cargá horarios o marcá el día como cerrado.');
      return;
    }

    try {
      await this.service.saveException({
        exception_date: this.exceptionDate,
        closed: this.exceptionClosed,
        slots: this.exceptionClosed ? [] : slots,
        note: this.exceptionNote.trim(),
      });

      this.exceptionDate = '';
      this.exceptionSlots = '';
      this.exceptionClosed = false;
      this.exceptionNote = '';
      this.message.set('Excepción guardada.');
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo guardar la excepción.');
    }
  }

  async removeException(row: ScheduleExceptionRecord): Promise<void> {
    if (!confirm(`¿Eliminar la excepción del ${row.exception_date}?`)) return;

    try {
      await this.service.deleteException(row.id);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo eliminar.');
    }
  }
}
