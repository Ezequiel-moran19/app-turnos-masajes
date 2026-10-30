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

    const reserveButton = page.getByRole('link', {
      name: 'Reservar turno',
      exact: true,
    }).first();

    await expect(reserveButton).toBeVisible();
    await reserveButton.click();

    await expect(booking.section).toBeInViewport();
    await expect(booking.reserveLink).toBeVisible();
  });

  test('el menú permite acceder a las secciones principales', async ({ page }) => {
    const navigation = page.locator('nav');

    await expect(navigation).toBeVisible();

    const links = navigation.locator('a[href^="#"]:not(.logo)');
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
    const navigation = page.locator('nav');

    const homeLink = navigation.getByRole('link', {
      name: 'Inicio',
      exact: true,
    });

    // Comprobamos que el enlace Inicio sea único.
    await expect(homeLink).toHaveCount(1);
    await expect(homeLink).toBeVisible();

    // Seleccionamos exclusivamente el enlace Reservar del menú.
    const bookingLink = navigation.locator('#menu a[href="#contacto"]');

    await expect(bookingLink).toHaveCount(1);
    await expect(bookingLink).toBeVisible();

    // Navegamos a la sección de turnos.
    await bookingLink.click();

    await expect(page.locator('#contacto')).toBeInViewport();

    // Regresamos al inicio.
    await homeLink.click();

    await expect(page.locator('#inicio')).toBeInViewport();
  });

});