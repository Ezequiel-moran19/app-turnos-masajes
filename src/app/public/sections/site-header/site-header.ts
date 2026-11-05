import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-site-header',
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  protected readonly open = signal(false);
  protected readonly links = [
    { href: '#inicio', label: 'Inicio' },
    { href: '#servicios', label: 'Tratamientos' },
    { href: '#contacto', label: 'Reservar' },
    { href: '#zona', label: 'Ubicación' },
  ];
}
