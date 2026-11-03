import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingAccessService, PrivateBooking } from '../../core/services/booking-access.service';

@Component({
  selector: 'app-my-booking',
  imports: [],
  templateUrl: './my-booking.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyBooking implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(BookingAccessService);

  readonly booking = signal<PrivateBooking | null>(null);
  readonly loading = signal(true);
  readonly cancelling = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  private token = '';

  async ngOnInit(): Promise<void> {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';

    if (!/^[0-9a-f]{64}$/.test(this.token)) {
      this.error.set('El enlace no es válido.');
      this.loading.set(false);
      return;
    }

    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.message.set('');

    try {
      const booking = await this.service.getByToken(this.token);

      if (!booking) {
        this.error.set(
          'No encontramos un turno asociado a este enlace. Verificá que sea correcto.',
        );
        return;
      }

      this.booking.set(booking);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo consultar el turno.');
    } finally {
      this.loading.set(false);
    }
  }

  async cancel(): Promise<void> {
    const booking = this.booking();

    if (!booking || !['pending', 'confirmed'].includes(booking.status) || this.cancelling()) {
      return;
    }

    const confirmed = window.confirm('¿Querés cancelar este turno? Esta acción no se puede deshacer desde esta página.');

    if (!confirmed) return;

    this.cancelling.set(true);
    this.error.set('');
    this.message.set('');

    try {
      const cancelled = await this.service.cancelByToken(this.token);

      if (!cancelled) {
        await this.load();
        this.message.set('El turno ya no se puede cancelar. Actualizamos su estado.');
        return;
      }

      this.booking.update((current) => current ? { ...current, status: 'cancelled' } : null);

      this.message.set('El turno fue cancelado correctamente.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cancelar el turno.');
    } finally {
      this.cancelling.set(false);
    }
  }

  formatDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  formatTime(time: string): string {
    return time.slice(0, 5);
  }

  statusLabel(status: PrivateBooking['status']): string {
    const labels: Record<PrivateBooking['status'], string> = {
      pending: 'Pendiente de confirmación',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
      completed: 'Completado',
    };

    return labels[status];
  }

  get canCancel(): boolean {
    const status = this.booking()?.status;
    return status === 'pending' || status === 'confirmed';
  }
}