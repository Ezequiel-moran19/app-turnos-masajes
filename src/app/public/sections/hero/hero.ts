import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Reveal } from '../../../shared/reveal';

@Component({
  selector: 'app-hero',
  imports: [Reveal],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {}
