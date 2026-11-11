import { expect, Locator, Page } from '@playwright/test';

export class BookingPage {
  readonly page: Page;
  readonly section: Locator;
  readonly form: Locator;

  readonly dayOptions: Locator;
  readonly timeOptions: Locator;
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly commentsInput: Locator;
  readonly reserveButton: Locator;

  readonly errorMessage: Locator;
  readonly summary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.section = page.locator('#contacto');
    this.form = this.section.locator('#reserva');

    this.dayOptions = this.section.locator('.days .opt');
    this.timeOptions = this.section.locator('.times .opt');

    this.nameInput = this.section.locator('#fName');
    this.phoneInput = this.section.locator('#fPhone');
    this.commentsInput = this.section.locator('#fComments');

    this.reserveButton = this.section.getByRole('button', {
      name: 'Reservar por WhatsApp',
    });

    this.errorMessage = this.section.getByRole('alert');
    this.summary = this.section.locator('aside.summary');
  }

  async selectFirstAvailableDay(): Promise<void> {
    await expect(this.dayOptions.first()).toBeVisible();

    await this.dayOptions.first().click();

    await expect(this.dayOptions.first()).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }

  async selectFirstAvailableTime(): Promise<void> {
    await expect(this.timeOptions.first()).toBeVisible();

    await this.timeOptions.first().click();

    await expect(this.timeOptions.first()).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }

  async fillPersonalData(
    name: string,
    phone: string,
    comments = '',
  ): Promise<void> {
    await this.nameInput.fill(name);
    await this.phoneInput.fill(phone);
    await this.commentsInput.fill(comments);
  }

  async submit(): Promise<void> {
    await this.reserveButton.click();
  }

  async expectSummary(): Promise<string> {
    const summaryText = await this.summary.innerText();
    const price = summaryText.match(/Precio\s*(\$[\d.]+)/);

    expect(price).not.toBeNull();

    return price![1];
  }

  async expectSelectedDayAndTime(): Promise<void> {
    await expect(
      this.section.locator('.days .opt[aria-pressed="true"]'),
    ).toHaveCount(1);

    await expect(
      this.section.locator('.times .opt[aria-pressed="true"]'),
    ).toHaveCount(1);
  }

  async expectValidationMessage(message: string): Promise<void> {
    await expect(this.errorMessage).toHaveText(message);
  }
}
