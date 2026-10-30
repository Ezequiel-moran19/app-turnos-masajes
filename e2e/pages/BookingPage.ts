import { expect, Locator, Page} from '@playwright/test';

export class BookingPage {
  readonly page: Page;
  readonly section: Locator;

  readonly dayOptions: Locator;
  readonly timeOptions: Locator;
  readonly nameInput: Locator;
  readonly commentsInput: Locator;
  readonly reserveLink: Locator;

  readonly errorMessage: Locator;
  readonly summary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.section = page.locator('#contacto');
    this.dayOptions = this.section.locator('.days .opt',);
    this.timeOptions = this.section.locator('.times .opt',);
    this.nameInput = this.section.locator('#fName');
    this.commentsInput = this.section.getByPlaceholder('Zona a trabajar, molestias o algo que quieras avisar',);

    this.reserveLink = this.section.getByRole('link',{ name: 'Reservar por WhatsApp' });

    this.errorMessage = this.section.getByRole('alert');
    this.summary = this.section.locator('aside.summary');
  }

  async selectFirstAvailableDay(): Promise<void> {
    await expect(this.dayOptions.first()).toBeVisible();
    await this.dayOptions.first().click();
    await expect(this.dayOptions.first()).toHaveAttribute('aria-pressed', 'true');
  }

  async selectFirstAvailableTime(): Promise<void> {
    await expect(this.timeOptions.first()).toBeVisible();
    await this.timeOptions.first().click();
    await expect(this.timeOptions.first()).toHaveAttribute('aria-pressed', 'true');
  }

  async fillPersonalData(name: string, comments: string,): Promise<void> {
    await this.nameInput.fill(name);
    await this.commentsInput.fill(comments);
  }

  async expectSummary(): Promise<void> {
    await expect(this.summary).toContainText('60 minutos');
    await expect(this.summary).toContainText('$25.000');
  }

  async expectSelectedDayAndTime(): Promise<void> {
    await expect(this.section.locator('.days .opt[aria-pressed="true"]'),).toHaveCount(1);
    await expect(this.section.locator('.times .opt[aria-pressed="true"]'),).toHaveCount(1);
  }

  async getWhatsAppUrl(): Promise<string> {
    const href = await this.reserveLink.getAttribute('href');

    expect(href).not.toBeNull();

    return href!;
  }

  async expectValidationMessage(message: string,): Promise<void> {
    await expect(this.errorMessage).toHaveText(message);
  }
}