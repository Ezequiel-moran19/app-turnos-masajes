import { ChangeDetectionStrategy, Component, ElementRef, inject} from '@angular/core';
import { BookingStore } from '../../core/booking.store';
import { MissingField } from '../../core/models';
import { CONTACTS } from '../../core/site.config';
import { Icon } from '../../shared/icon';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'app-booking',
  imports: [Icon, Reveal],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingSection {
  protected readonly store = inject(BookingStore);
  protected readonly contacts = CONTACTS;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected textOf(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected onSend(event: Event): void {
    const missing = this.store.validate();

    if (missing === null) return;

    event.preventDefault();
    this.focusField(missing);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    const missing = this.store.validate();

    if (missing === null) {
      window.open(this.store.whatsappUrl(), '_blank', 'noopener');
    } else {
      this.focusField(missing);
    }
  }

  private focusField(field: MissingField): void {
    const selector =
      field === 'date'
        ? '.days .opt'
        : field === 'time'
          ? '.times .opt'
          : '#fName';

    this.host.querySelector<HTMLElement>(selector)?.focus();
  }
}
