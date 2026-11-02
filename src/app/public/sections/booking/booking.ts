import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
} from '@angular/core';

import { BookingStore } from '../../../core/booking.store';
import { MissingField } from '../../../core/models';
import { CONTACTS } from '../../../core/site.config';
import { Reveal } from '../../../shared/reveal';

@Component({
  selector: 'app-booking',
  imports: [Reveal],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingSection {
  protected readonly store = inject(BookingStore);
  protected readonly contacts = CONTACTS;
  protected readonly sending = signal(false);

  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected textOf(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.sending()) return;

    const missing = this.store.validate();

    if (missing !== null) {
      this.focusField(missing);
      return;
    }

    if (this.store.error()) return;

    const win = window.open('', '_blank');

    if (win) win.opener = null;

    this.sending.set(true);

    try {
      await this.store.submit();

      const url = this.store.whatsappUrl();

      if (win) {
        win.location.href = url;
      } else {
        window.location.href = url;
      }

      this.store.reset();
    } catch (error) {
      win?.close();

      this.store.error.set(
        error instanceof Error
          ? error.message
          : 'No se pudo reservar. Probá de nuevo.',
      );
    } finally {
      this.sending.set(false);
    }
  }

  private focusField(field: MissingField): void {
    const selector =
      field === 'date'
        ? '.days .opt'
        : field === 'time'
          ? '.times .opt'
          : field === 'name'
            ? '#fName'
            : '#fPhone';

    this.host.querySelector<HTMLElement>(selector)?.focus();
  }
}