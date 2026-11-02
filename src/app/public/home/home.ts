import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SiteHeader } from '../sections/site-header/site-header';
import { Hero } from '../sections/hero/hero';
import { Tratamientos } from '../sections/tratamientos/tratamientos';
import { ZoneSection } from '../sections/zone/zone';
import { BookingSection } from '../sections/booking/booking';
import { SiteFooter } from '../sections/site-footer/site-footer';

@Component({
  selector: 'app-home',
  imports: [ SiteHeader, Hero, Tratamientos, ZoneSection, BookingSection, SiteFooter ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
