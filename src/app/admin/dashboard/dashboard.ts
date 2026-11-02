import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { BookingService } from '../../core/services/booking.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly bookings = inject(BookingService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly counts = signal({ total: 0, pending: 0, confirmed: 0 });

  async ngOnInit(): Promise<void> {
    try { this.counts.set(await this.bookings.counts()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el resumen.'); }
    finally { this.loading.set(false); }
  }
}
