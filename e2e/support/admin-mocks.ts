import { Page } from '@playwright/test';

const USER_ID = '11111111-1111-4111-8111-111111111111';

function futureDate(days = 2): string {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function installAdminMocks(
  page: Page,
  role: 'admin' | 'user' = 'admin',
): Promise<void> {
  let authenticated = false;

  const bookings: any[] = [
    {
      id: 'booking-1',
      customer_name: 'Cliente Pendiente',
      customer_phone: '1123456789',
      service_id: null,
      booking_date: futureDate(2),
      start_time: '10:00:00',
      end_time: '11:00:00',
      status: 'pending',
      notes: 'Prueba pendiente',
      services: { name: 'Masaje descontracturante' },
    },
    {
      id: 'booking-2',
      customer_name: 'Cliente Confirmado',
      customer_phone: '1134567890',
      service_id: null,
      booking_date: futureDate(3),
      start_time: '11:00:00',
      end_time: '12:00:00',
      status: 'confirmed',
      notes: '',
      services: { name: 'Masaje deportivo' },
    },
    {
      id: 'booking-3',
      customer_name: 'Cliente Completado',
      customer_phone: '1145678901',
      service_id: null,
      booking_date: futureDate(4),
      start_time: '12:00:00',
      end_time: '13:00:00',
      status: 'completed',
      notes: '',
      services: { name: 'Masaje deportivo' },
    },
    {
      id: 'booking-4',
      customer_name: 'Cliente Cancelado',
      customer_phone: '1156789012',
      service_id: null,
      booking_date: futureDate(5),
      start_time: '13:00:00',
      end_time: '14:00:00',
      status: 'cancelled',
      notes: '',
      services: { name: 'Masaje descontracturante' },
    },
  ];

  const weeklySchedule = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    enabled: weekday >= 1 && weekday <= 6,
    slots: weekday >= 1 && weekday <= 6 ? ['09:00', '10:00'] : [],
  }));

  const exceptions: any[] = [];

  const treatments: any[] = [
    {
      id: 'treatment-1',
      name: 'Masaje descontracturante',
      description: 'Tratamiento de prueba.',
      benefits: ['Alivio de tensión', 'Relajación muscular'],
      image_url: '/cards/masaje.jpg',
      active: true,
      sort_order: 1,
    },
  ];

  const headers = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods':
      'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'content-type': 'application/json',
  };

  const json = (status: number, data: unknown) => ({
    status,
    headers,
    body: JSON.stringify(data),
  });

  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }

    if (path.endsWith('/token') && method === 'POST') {
      const body = request.postDataJSON();

      if (
        body.email !== 'admin@prueba.com' ||
        body.password !== 'Admin123!'
      ) {
        if (
          body.email !== 'usuario@prueba.com' ||
          body.password !== 'User123!'
        ) {
          await route.fulfill(
            json(400, {
              code: 'invalid_credentials',
              error_code: 'invalid_credentials',
              msg: 'Invalid login credentials',
              message: 'Invalid login credentials',
            }),
          );
          return;
        }
      }

      authenticated = true;

      await route.fulfill(
        json(200, {
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: USER_ID,
            aud: 'authenticated',
            role: 'authenticated',
            email: body.email,
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
            created_at: new Date().toISOString(),
          },
        }),
      );
      return;
    }

    if (path.endsWith('/user') && method === 'GET') {
      if (!authenticated) {
        await route.fulfill(
          json(401, { message: 'Not authenticated' }),
        );
        return;
      }

      await route.fulfill(
        json(200, {
          id: USER_ID,
          aud: 'authenticated',
          role: 'authenticated',
          email:
            role === 'admin'
              ? 'admin@prueba.com'
              : 'usuario@prueba.com',
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {},
          created_at: new Date().toISOString(),
        }),
      );
      return;
    }

    if (path.endsWith('/logout') && method === 'POST') {
      authenticated = false;
      await route.fulfill({ status: 204, headers });
      return;
    }

    await route.fulfill(json(404, { message: 'Auth endpoint no simulado' }));
  });

  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }

    if (path.endsWith('/profiles') && method === 'GET') {
      if (!authenticated) {
        await route.fulfill(json(401, { message: 'Not authenticated' }));
        return;
      }

      const profile = { role };

      if (
        request.headers()['accept']?.includes(
          'application/vnd.pgrst.object+json',
        )
      ) {
        await route.fulfill(json(200, profile));
      } else {
        await route.fulfill(json(200, [profile]));
      }
      return;
    }

    if (path.endsWith('/bookings')) {
      if (method === 'GET') {
        await route.fulfill(json(200, bookings));
        return;
      }

      if (method === 'PATCH') {
        const id = url.searchParams.get('id')?.replace('eq.', '');
        const body = request.postDataJSON();
        const row = bookings.find((item) => item.id === id);

        if (row) Object.assign(row, body);

        await route.fulfill({ status: 204, headers });
        return;
      }
    }

    if (path.endsWith('/weekly_schedule')) {
      if (method === 'GET') {
        await route.fulfill(json(200, weeklySchedule));
        return;
      }

      if (method === 'POST') {
        const body = request.postDataJSON();
        const rows = Array.isArray(body) ? body : [body];

        for (const item of rows) {
          const index = weeklySchedule.findIndex(
            (day) => day.weekday === item.weekday,
          );

          if (index >= 0) weeklySchedule[index] = item;
          else weeklySchedule.push(item);
        }

        await route.fulfill({ status: 204, headers });
        return;
      }
    }

    if (path.endsWith('/schedule_exceptions')) {
      if (method === 'GET') {
        await route.fulfill(json(200, exceptions));
        return;
      }

      if (method === 'POST') {
        const body = request.postDataJSON();
        const index = exceptions.findIndex(
          (item) => item.exception_date === body.exception_date,
        );

        if (index >= 0) {
          exceptions[index] = { ...exceptions[index], ...body };
        } else {
          exceptions.push({
            id: `exception-${Date.now()}`,
            ...body,
          });
        }

        await route.fulfill({ status: 204, headers });
        return;
      }

      if (method === 'DELETE') {
        const id = url.searchParams.get('id')?.replace('eq.', '');
        const index = exceptions.findIndex((item) => item.id === id);

        if (index >= 0) exceptions.splice(index, 1);

        await route.fulfill({ status: 204, headers });
        return;
      }
    }

    if (path.endsWith('/treatments')) {
      if (method === 'GET') {
        await route.fulfill(json(200, treatments));
        return;
      }

      if (method === 'POST') {
        const body = request.postDataJSON();

        treatments.push({
          id: `treatment-${Date.now()}`,
          sort_order: treatments.length + 1,
          ...body,
        });

        await route.fulfill({ status: 201, headers });
        return;
      }

      if (method === 'PATCH') {
        const id = url.searchParams.get('id')?.replace('eq.', '');
        const body = request.postDataJSON();
        const row = treatments.find((item) => item.id === id);

        if (row) Object.assign(row, body);

        await route.fulfill({ status: 204, headers });
        return;
      }
    }

    await route.fulfill(
      json(404, {
        message: `Endpoint no simulado: ${method} ${path}`,
      }),
    );
  });
}
