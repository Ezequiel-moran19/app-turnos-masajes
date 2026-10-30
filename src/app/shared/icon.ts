import { ChangeDetectionStrategy, Component, computed, input} from '@angular/core';

import { IconName } from '../core/models';
import { ICONS } from './icons';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();

  protected readonly shapes = computed(
    () => ICONS[this.name()] ?? [],
  );
}