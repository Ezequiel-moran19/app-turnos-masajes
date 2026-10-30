import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TREATMENTS } from '../../core/site.config';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'app-services',
  imports: [Reveal],
  templateUrl: './services.html',
  styleUrl: './services.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesSection {
  protected readonly treatments = TREATMENTS;
}