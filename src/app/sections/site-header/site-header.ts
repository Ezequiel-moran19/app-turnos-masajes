import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SITE } from '../../core/site.config';

@Component({
  selector: 'app-site-header',
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  protected readonly brand = SITE.brand;
  protected readonly open = signal(false);
  protected readonly links = [
    { href: '#inicio', label: 'Inicio' },
    { href: '#servicios', label: 'Sesiones' },
    { href: '#contacto', label: 'Reservar' },
    { href: '#zona', label: 'Ubicación' },
  ];
}
