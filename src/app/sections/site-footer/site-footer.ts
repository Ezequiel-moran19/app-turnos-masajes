import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE } from '../../core/site.config';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
  protected readonly brand = SITE.brand;
}
