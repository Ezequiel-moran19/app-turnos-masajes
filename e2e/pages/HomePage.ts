
import { expect, Locator, Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly hero: Locator;
  readonly bookingSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hero = page.locator('app-hero');
    this.bookingSection = page.locator('#contacto');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await expect(this.hero).toBeVisible();
  }

  async goToBooking(): Promise<void> {
    await expect(this.bookingSection).toBeAttached();
    await this.bookingSection.scrollIntoViewIfNeeded();
    await expect(this.bookingSection).toBeInViewport();
  }
}
