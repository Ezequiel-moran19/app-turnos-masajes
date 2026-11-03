import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WeeklyScheduleRecord } from '../../core/models';
import { ScheduleService } from '../../core/services/schedule.service';

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

  readonly days = signal<WeeklyScheduleRecord[]>([]);
  readonly error = signal('');
  readonly message = signal('');
  readonly saving = signal(false);
  readonly dayNames = [ 'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  /** Texto editable de horarios por día. */
  slotsText: Record<number, string> = {};
  genStart = '09:00';
  genEnd = '18:00';
  genStep = 60;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.error.set('');

    try {
      const stored = await this.service.getWeekly();

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

      for (const day of days) {
        text[day.weekday] = day.slots.join(', ');
      }

      this.slotsText = text;
      this.days.set(days);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los horarios.');
    }
  }

  setEnabled(weekday: number, enabled: boolean): void {
    this.days.update((rows) =>
      rows.map((row) => row.weekday === weekday ? { ...row, enabled } : row),
    );
  }

  /** Genera horarios a partir del rango Desde / Hasta / Cada. */
  private buildSlots(): string[] | null {
    const toMin = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
    const toStr = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

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

    for (let minutes = toMin(this.genStart);
      minutes < toMin(this.genEnd);
      minutes += this.genStep
    ) {
      slots.push(toStr(minutes));
    }

    return slots;
  }

  fillDay(weekday: number): void {
    this.error.set('');
    this.message.set('');

    const slots = this.buildSlots();

    if (!slots) return;

    this.slotsText[weekday] = slots.join(', ');
    this.setEnabled(weekday, true);
  }

  /** Aplica el rango generado a lunes–sábado. */
  applyToWorkdays(): void {
    this.error.set('');
    this.message.set('');

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

    const { slots, invalid } = parseSlots(this.slotsText[day.weekday] ?? '',);

    if (invalid.length) {
      this.error.set(`${name}: horarios inválidos (${invalid.join(', ')}). Usá formato HH:mm.`);

      return null;
    }

    if (day.enabled && slots.length === 0) {
      this.error.set(`${name} está habilitado pero no tiene horarios.`);

      return null;
    }

    return {
      weekday: day.weekday,
      enabled: day.enabled,
      slots,
    };
  }

  async saveDay(day: WeeklyScheduleRecord): Promise<void> {
    this.error.set('');
    this.message.set('');

    const row = this.collect(day);

    if (!row) return;

    this.saving.set(true);

    try {
      await this.service.saveWeekly(row);

      this.message.set( `Horario de ${this.dayNames[day.weekday]} guardado.`);

      await this.load();
    } catch (e) {
      this.error.set( e instanceof Error ? e.message : 'No se pudo guardar.');
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
}