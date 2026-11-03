import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TreatmentRecord } from '../../core/models';
import { TreatmentsService } from '../../core/services/treatments.service';

@Component({
  selector: 'app-treatments',
  imports: [FormsModule],
  templateUrl: './treatments.html',
  styleUrl: './treatments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Treatments implements OnInit {
  private readonly service = inject(TreatmentsService);

  readonly rows = signal<TreatmentRecord[]>([]);
  readonly error = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  name = '';
  description = '';
  benefitsText = '';
  image = '';
  active = true;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.rows.set(await this.service.list());
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los tratamientos.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  edit(row: TreatmentRecord): void {
    this.editingId.set(row.id);
    this.name = row.name;
    this.description = row.description;
    this.benefitsText = (row.benefits ?? []).join('\n');
    this.image = row.image_url ?? '';
    this.active = row.active;
  }

  reset(): void {
    this.editingId.set(null);
    this.name = '';
    this.description = '';
    this.benefitsText = '';
    this.image = '';
    this.active = true;
  }

  async save(): Promise<void> {
    this.error.set('');

    if (!this.name.trim()) {
      this.error.set('Ingresá el nombre del tratamiento.');
      return;
    }

    this.saving.set(true);

    try {
      await this.service.save({
        id: this.editingId() ?? undefined,
        name: this.name.trim(),
        description: this.description.trim(),
        benefits: this.benefitsText
          .split('\n')
          .map((value) => value.trim())
          .filter(Boolean),
        image_url: this.image.trim(),
        active: this.active,
      });

      this.reset();
      await this.load();
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el tratamiento.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(row: TreatmentRecord): Promise<void> {
    const newStatus = !row.active;
    const action = newStatus ? 'reactivar' : 'dar de baja';

    if (!confirm(`¿Querés ${action} "${row.name}"?`)) {
      return;
    }

    try {
      this.error.set('');
      await this.service.setActive(row.id, newStatus);
      await this.load();
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'No se pudo modificar el estado del tratamiento.',
      );
    }
  }
}