import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CONTACTS, SITE } from '../../../core/site.config';

@Component({
  selector: 'app-site-footer',
  imports: [],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
  protected readonly contacts = CONTACTS;
  protected readonly whatsappHref = `https://wa.me/${SITE.whatsapp.number}`;

  protected readonly links = [
    { href: '#inicio', label: 'Inicio' },
    { href: '#servicios', label: 'Tratamientos' },
    { href: '#contacto', label: 'Reservar' },
    { href: '#zona', label: 'Ubicación' },
  ];
}