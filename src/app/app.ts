import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SiteHeader } from './sections/site-header/site-header';
import { Hero } from './sections/hero/hero';
import { ServicesSection } from './sections/services/services';
import { ZoneSection } from './sections/zone/zone';
import { BookingSection } from './sections/booking/booking';
import { SiteFooter } from './sections/site-footer/site-footer';

@Component({
  selector: 'app-root',
  imports: [SiteHeader, Hero, ServicesSection, ZoneSection, BookingSection, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
