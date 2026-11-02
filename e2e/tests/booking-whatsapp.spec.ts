import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { BookingPage } from '../pages/BookingPage';

test.describe('Reserva de turnos - Masajes', () => {
  let createdBooking: Record<string, unknown> | null;

  test.beforeEach(async ({ page }) => {
    createdBooking = null;

    await page.route('**/rest/v1/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      const method = request.method();

      if (method === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
            'access-control-allow-methods':
              'GET, POST, PATCH, DELETE, OPTIONS',
          },
        });
        return;
      }

      const headers = {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods':
          'GET, POST, PATCH, DELETE, OPTIONS',
        'content-type': 'application/json',
      };

      // Simular horarios semanales.
      if (path.endsWith('/weekly_schedule') && method === 'GET') {
        const weeklySchedule = Array.from(
          { length: 7 },
          (_, weekday) => ({
            weekday,
            enabled: true,
            slots: ['22:00'],
          }),
        );

        await route.fulfill({
          status: 200,
          headers,
          body: JSON.stringify(weeklySchedule),
        });
        return;
      }

      // Simular calendario sin excepciones.
      if (path.endsWith('/schedule_exceptions') && method === 'GET') {
        await route.fulfill({
          status: 200,
          headers,
          body: JSON.stringify([]),
        });
        return;
      }

      // Simular que ningún horario está ocupado.
      if (path.endsWith('/rpc/get_taken_slots') && method === 'POST') {
        await route.fulfill({
          status: 200,
          headers,
          body: JSON.stringify([]),
        });
        return;
      }

      // Simular la creación de una reserva mediante la nueva RPC.
      if (
        path.endsWith('/rpc/public_create_booking_with_access') &&
        method === 'POST'
      ) {
        createdBooking = request.postDataJSON();

        await route.fulfill({
          status: 200,
          headers,
          body: JSON.stringify(
            '11111111-1111-4111-8111-111111111111',
          ),
        });
        return;
      }

      await route.continue();
    });
  });

  test('valida que el día sea obligatorio', async ({ page }) => {
    const home = new HomePage(page);
    const booking = new BookingPage(page);

    await home.open();
    await home.goToBooking();

    await booking.submit();

    await booking.expectValidationMessage('Elegí un día.');
  });

  test('valida que el horario sea obligatorio', async ({ page }) => {
    const home = new HomePage(page);
    const booking = new BookingPage(page);

    await home.open();
    await home.goToBooking();

    await booking.selectFirstAvailableDay();
    await booking.submit();

    await booking.expectValidationMessage('Elegí un horario.');
  });

  test('valida que el nombre sea obligatorio', async ({ page }) => {
    const home = new HomePage(page);
    const booking = new BookingPage(page);

    await home.open();
    await home.goToBooking();

    await booking.selectFirstAvailableDay();
    await booking.selectFirstAvailableTime();
    await booking.phoneInput.fill('1123456789');

    await booking.submit();

    await booking.expectValidationMessage('Ingresá tu nombre.');
  });

  test('valida que el teléfono sea obligatorio', async ({ page }) => {
    const home = new HomePage(page);
    const booking = new BookingPage(page);

    await home.open();
    await home.goToBooking();

    await booking.selectFirstAvailableDay();
    await booking.selectFirstAvailableTime();
    await booking.nameInput.fill('Ezequiel');

    await booking.submit();

    await booking.expectValidationMessage(
      'Ingresá un teléfono válido.',
    );
  });

  test('valida que el teléfono tenga al menos ocho dígitos', async ({
    page,
  }) => {
    const home = new HomePage(page);
    const booking = new BookingPage(page);

    await home.open();
    await home.goToBooking();

    await booking.selectFirstAvailableDay();
    await booking.selectFirstAvailableTime();

    await booking.fillPersonalData('Ezequiel', '1234567');
    await booking.submit();

    await booking.expectValidationMessage(
      'Ingresá un teléfono válido.',
    );
  });

  test('completa la reserva y abre WhatsApp con el mensaje correcto', async ({
    page,
  }) => {
    const home = new HomePage(page);
    const booking = new BookingPage(page);

    await home.open();
    await home.goToBooking();

    await booking.selectFirstAvailableDay();
    await booking.selectFirstAvailableTime();

    await booking.fillPersonalData(
      'Ezequiel Prueba',
      '1123456789',
      'Molestia en la zona lumbar. Prueba automatizada.',
    );

    await booking.expectSelectedDayAndTime();
    await booking.expectSummary();

    const popupPromise = page.waitForEvent('popup');

    await booking.submit();

    const popup = await popupPromise;

    // Esperar a que la aplicación asigne la URL de WhatsApp.
    await expect
      .poll(() => popup.url())
      .toMatch(/^https:\/\/(api\.whatsapp\.com|wa\.me)\//);

    const whatsappUrl = new URL(popup.url());
    const message = whatsappUrl.searchParams.get('text');

    // Validar el dominio de WhatsApp.
    expect([
      'api.whatsapp.com',
      'wa.me',
    ]).toContain(whatsappUrl.hostname);

    // Validar el destinatario.
    const recipient =
      whatsappUrl.hostname === 'wa.me'
        ? whatsappUrl.pathname.replace(/\//g, '')
        : whatsappUrl.searchParams.get('phone');

    expect(recipient).toMatch(/^\d+$/);

    // Validar el mensaje.
    expect(message).not.toBeNull();

    expect(message).toContain(
      'Hola! Quiero reservar un turno de masajes.',
    );

    expect(message).toContain('Precio: $25.000');
    expect(message).toContain('Nombre: Ezequiel Prueba');
    expect(message).toContain('Teléfono: 1123456789');

    expect(message).toContain(
      'Comentarios: Molestia en la zona lumbar. Prueba automatizada.',
    );

    // Verificar que el mensaje incluya el enlace privado.
    expect(message).toContain(
      'Podés consultar el estado de tu turno o cancelarlo desde este enlace:',
    );

    expect(message).toMatch(
      /mi-turno\/[0-9a-f]{64}/,
    );

    // Verificar que se haya llamado a la nueva RPC.
    expect(createdBooking).not.toBeNull();

    expect(createdBooking).toMatchObject({
      p_customer_name: 'Ezequiel Prueba',
      p_customer_phone: '1123456789',
      p_service_id: null,
      p_start_time: '22:00',
      p_end_time: '23:00',
      p_notes: 'Molestia en la zona lumbar. Prueba automatizada.',
    });

    expect(createdBooking?.p_booking_date).toBeTruthy();

    expect(createdBooking?.p_token_hash).toMatch(
      /^[0-9a-f]{64}$/,
    );

    await popup.close();
  });
});