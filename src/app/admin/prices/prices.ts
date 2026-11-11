import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceRecord } from '../../core/models';
import { PricingService } from '../../core/services/pricing.service';

@Component({
  selector: 'app-prices',
  imports: [FormsModule],
  templateUrl: './prices.html',
  styleUrl: './prices.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Prices implements OnInit {
  private readonly pricing = inject(PricingService);

  readonly service = signal<ServiceRecord | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  priceInput: number | null = null;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    try {
      const result = await this.pricing.getGeneral();
      this.service.set(result);
      this.priceInput = result.price;
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'No se pudo consultar el precio.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.error.set('');
    this.success.set('');

    const price = Number(this.priceInput);

    if (!Number.isFinite(price) || price <= 0 || price > 9999999999.99) {
      this.error.set('Ingresá un precio válido mayor a cero.');
      return;
    }

    this.saving.set(true);

    try {
      const updated = await this.pricing.updateGeneralPrice(price);

      this.service.set(updated);
      this.priceInput = updated.price;
      this.success.set('El precio se actualizó correctamente.');
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el precio.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  formatPrice(value: number): string {
    return '$' + value.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
}
