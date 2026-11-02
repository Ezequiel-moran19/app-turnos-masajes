import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { BookingPage } from '../pages/BookingPage';

test.describe('Navegación de la landing - Masajes', () => {
  test.beforeEach(async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
  });

  test('carga correctamente la página principal', async ({ page }) => {
    const home = new HomePage(page);

    await expect(home.hero).toBeVisible();
    await expect(page).toHaveURL('/');
    await expect(page.locator('#inicio')).toBeVisible();
  });

  test('permite navegar hasta la sección de turnos', async ({ page }) => {
    const booking = new BookingPage(page);

    const reserveButton = page.locator(
      'nav[aria-label="Principal"] a.nav-cta[href="#contacto"]',
    );

    await expect(reserveButton).toBeVisible();
    await reserveButton.click();

    await expect(booking.section).toBeInViewport();
    await expect(booking.reserveButton).toBeVisible();
  });

  test('el menú permite acceder a las secciones principales', async ({
    page,
  }) => {
    const navigation = page.locator('nav[aria-label="Principal"]');
    const links = navigation.locator('#menu a[href^="#"]');

    await expect(navigation).toBeVisible();

    const linkCount = await links.count();

    expect(linkCount).toBeGreaterThan(0);

    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');

      if (!href || href === '#') {
        continue;
      }

      const target = page.locator(href);

      await expect(link).toBeVisible();
      await expect(target).toHaveCount(1);

      await link.click();

      await expect(target).toBeInViewport();
    }
  });

  test('permite regresar al inicio desde el menú', async ({ page }) => {
    const navigation = page.locator('nav[aria-label="Principal"]');

    const homeLink = navigation.locator('.navbar-brand.logo');

    // Seleccionar únicamente el enlace del menú, no el botón CTA.
    const bookingLink = navigation.locator(
      '#menu a.nav-link[href="#contacto"]',
    );

    const homeSection = page.locator('#inicio');
    const bookingSection = page.locator('#contacto');

    await expect(homeLink).toBeVisible();
    await expect(bookingLink).toBeVisible();

    await bookingLink.click();

    await expect(bookingSection).toBeInViewport();

    await homeLink.click();

    await expect(homeSection).toBeInViewport();
  });
});
