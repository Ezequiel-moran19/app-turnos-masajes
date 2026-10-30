import { test, expect,} from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { BookingPage } from '../pages/BookingPage';

test.describe('Reserva de turnos - Masajes', () => {
  test('valida que el día sea obligatorio', async ({ page }) => {
    const home = new HomePage(page);
    const booking = new BookingPage(page);

    await home.open();
    await home.goToBooking();
    await booking.reserveLink.click();
    await booking.expectValidationMessage('Elegí el día del turno.');
  });

  test('valida que el horario sea obligatorio', async ({ page }) => {
    const home = new HomePage(page);
    const booking = new BookingPage(page);

    await home.open();
    await home.goToBooking();

    await booking.selectFirstAvailableDay();
    await booking.reserveLink.click();
    await booking.expectValidationMessage('Elegí el horario.');
  });

  test('valida que el nombre sea obligatorio', async ({ page }) => {
    const home = new HomePage(page);
    const booking = new BookingPage(page);

    await home.open();
    await home.goToBooking();

    await booking.selectFirstAvailableDay();
    await booking.selectFirstAvailableTime();

    await booking.reserveLink.click();
    await booking.expectValidationMessage('Ingresá tu nombre para armar el mensaje.');
  });

  test('completa la reserva y abre WhatsApp con el mensaje correcto', async ({
    page,
  }) => {
    const home = new HomePage(page);
    const booking = new BookingPage(page);

    await home.open();
    await home.goToBooking();

    // 1. Seleccionar un día disponible.
    await booking.selectFirstAvailableDay();

    // 2. Seleccionar un horario disponible.
    await booking.selectFirstAvailableTime();

    // 3. Completar los datos.
    await booking.fillPersonalData('Ezequiel Prueba','Molestia en la zona lumbar. Prueba automatizada.');

    // 4. Comprobar que el día y el horario quedaron seleccionados.
    await booking.expectSelectedDayAndTime();

    // 5. Verificar el resumen.
    await booking.expectSummary();

    // 6. Comprobar el enlace y el contenido del mensaje.
    const href = await booking.getWhatsAppUrl();
    const whatsappUrl = new URL(href);
    const message = whatsappUrl.searchParams.get('text');

    expect(whatsappUrl.hostname).toBe('wa.me');
    expect(whatsappUrl.pathname).toBe('/5491167597638');

    expect(message).toContain('Hola! Quiero reservar un turno:',);
    expect(message).toContain('Servicio: Sesión de masajes');
    expect(message).toContain('Duración: 60 minutos');
    expect(message).toContain('Precio: $25.000');
    expect(message).toContain('Nombre: Ezequiel Prueba');
    expect(message).toContain('Comentarios: Molestia en la zona lumbar. Prueba automatizada.');

    // 7. Hacer clic y comprobar que se abre WhatsApp.
    const popupPromise = page.waitForEvent('popup');

    await booking.reserveLink.click();

    const popup = await popupPromise;

    await expect
      .poll(() => popup.url())
      .toMatch(/wa\.me|whatsapp\.com/);

    await popup.close();
  });
});