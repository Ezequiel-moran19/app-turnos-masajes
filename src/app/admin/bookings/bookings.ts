import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, } from '@angular/core';
import { BookingRecord } from '../../core/models';
import { BookingService } from '../../core/services/booking.service';
import { BookingAccessService } from '../../core/services/booking-access.service';
import { BookingStatus, formatDate, hhmm, STATUS_LABEL, todayISO, whatsappLink, } from '../../core/booking-status';

type StatusFilter = 'all' | BookingStatus;

@Component({
  selector: 'app-bookings',
  imports: [],
  templateUrl: './bookings.html',
  styleUrl: './bookings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bookings implements OnInit {
  private readonly service = inject(BookingService);
  private readonly accessService = inject(BookingAccessService);

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly formatDate = formatDate;
  protected readonly hhmm = hhmm;
  protected readonly whatsappLink = whatsappLink;

  protected readonly filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'confirmed', label: 'Confirmados' },
    { value: 'completed', label: 'Completados' },
    { value: 'cancelled', label: 'Cancelados' },
  ];

  readonly rows = signal<BookingRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busyId = signal<string | null>(null);
  readonly accessLinks = signal<Record<string, string>>({});
  readonly accessBusyId = signal<string | null>(null);
  readonly accessError = signal('');
  readonly accessMessage = signal('');
  readonly filter = signal<StatusFilter>('pending');
  readonly onlyUpcoming = signal(true);
  readonly query = signal('');

  readonly counts = computed(() => {
    const all = this.rows();
    const by = (status: BookingStatus) => all.filter((row) => row.status === status).length;

    return { all: all.length, pending: by('pending'), confirmed: by('confirmed'), completed: by('completed'), cancelled: by('cancelled') };
  });

  readonly visible = computed(() => {
    const filter = this.filter();
    const query = this.query().trim().toLowerCase();
    const today = todayISO();

    return this.rows().filter((row) => {
      if (filter !== 'all' && row.status !== filter) return false;
      if (this.onlyUpcoming() && row.booking_date < today) return false;

      if (query && !row.customer_name.toLowerCase().includes(query) && !row.customer_phone.includes(query)) {
        return false;
      }

      return true;
    });
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.rows.set(await this.service.list());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudieron cargar los turnos.');
    } finally {
      this.loading.set(false);
    }
  }

  async setStatus(row: BookingRecord, status: BookingStatus): Promise<void> {
    if (row.status === status) return;

    if (status === 'cancelled' && !confirm(`¿Cancelar el turno de ${row.customer_name}?`)) {
      return;
    }

    const previous = row.status;

    this.error.set('');
    this.busyId.set(row.id);
    this.patch(row.id, status);

    try {
      await this.service.updateStatus(row.id, status);
    } catch (error) {
      this.patch(row.id, previous);
      this.error.set(error instanceof Error ? error.message : 'No se pudo actualizar el turno.',
      );
    } finally {
      this.busyId.set(null);
    }
  }

  async generateAccessLink(row: BookingRecord): Promise<void> {
    this.accessError.set('');
    this.accessMessage.set('');
    this.accessBusyId.set(row.id);

    try {
      const link = await this.accessService.createAccessLink(row.id);

      this.accessLinks.update((links) => ({ ...links, [row.id]: link }));

      this.accessMessage.set(`Se generó el enlace privado para ${row.customer_name}.`);
    } catch (error) {
      this.accessError.set(error instanceof Error ? error.message : 'No se pudo generar el enlace privado.');
    } finally {
      this.accessBusyId.set(null);
    }
  }

  async copyAccessLink(row: BookingRecord): Promise<void> {
    const link = this.accessLinks()[row.id];

    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      this.accessMessage.set('Enlace copiado al portapapeles.');
      this.accessError.set('');
    } catch {
      this.accessError.set('No se pudo copiar el enlace. Seleccionalo desde el navegador.');
    }
  }

  accessWhatsappUrl(row: BookingRecord): string {
    const link = this.accessLinks()[row.id];

    const message = [`Hola ${row.customer_name}.`,
      'Desde este enlace podés consultar el estado de tu turno y cancelarlo si lo necesitás:',
      link ].join('\n');

    return whatsappLink(row.customer_phone, message);
  }

  private patch(id: string, status: BookingStatus): void {
    this.rows.update((rows) => rows.map((row) => (row.id === id ? { ...row, status } : row)));
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
