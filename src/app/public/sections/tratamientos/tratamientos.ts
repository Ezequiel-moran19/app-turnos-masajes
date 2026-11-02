import { ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { Reveal } from '../../../shared/reveal';

interface PublicTreatment {
  name: string;
  description: string;
  benefits: string[];
  image: string;
}

@Component({
  selector: 'app-tratamientos',
  imports: [Reveal],
  templateUrl: './tratamientos.html',
  styleUrl: './tratamientos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tratamientos implements OnInit {
  private readonly service = inject(TreatmentsService);

  protected readonly treatments = signal<PublicTreatment[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const records = await this.service.listPublic();

      this.treatments.set(
        records.map((record) => ({
          name: record.name,
          description: record.description,
          benefits: record.benefits ?? [],
          image: record.image_url ?? '',
        })),
      );
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
}