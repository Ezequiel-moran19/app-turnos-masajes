import { test, expect } from '@playwright/test';
import { installAdminMocks } from '../support/admin-mocks';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await installAdminMocks(page);

  await page.goto('/admin/login');
  await page.locator('#email').fill('admin@prueba.com');
  await page.locator('#password').fill('Admin123!');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

test.describe('Administración - Autenticación', () => {
  test('redirige al login cuando no existe una sesión', async ({ page }) => {
    await installAdminMocks(page);

    await page.goto('/admin/bookings');

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(
      page.getByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeVisible();
  });

  test('permite ingresar con credenciales de administrador', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(
      page.getByRole('heading', { name: 'Resumen' }),
    ).toBeVisible();
  });

  test('rechaza credenciales incorrectas', async ({ page }) => {
    await installAdminMocks(page);

    await page.goto('/admin/login');
    await page.locator('#email').fill('admin@prueba.com');
    await page.locator('#password').fill('incorrecta');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByRole('alert')).toContainText(
      'Invalid login credentials',
    );

    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('rechaza usuarios que no tienen rol administrador', async ({ page }) => {
    await installAdminMocks(page, 'user');

    await page.goto('/admin/login');
    await page.locator('#email').fill('usuario@prueba.com');
    await page.locator('#password').fill('User123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByRole('alert')).toContainText(
      'El usuario no tiene permisos de administrador.',
    );

    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('Administración - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('muestra los contadores de turnos', async ({ page }) => {
    await expect(
      page.getByText('Turnos registrados', { exact: true }),
    ).toBeVisible();

    await expect(
      page.locator('.stat-label').filter({ hasText: /^Pendientes$/ }),
    ).toBeVisible();

    await expect(
      page.locator('.stat-label').filter({ hasText: /^Confirmados$/ }),
    ).toBeVisible();

    const values = page.locator('.stat-value');

    await expect(values.nth(0)).toHaveText('4');
    await expect(values.nth(1)).toHaveText('1');
    await expect(values.nth(2)).toHaveText('1');
  });
});

test.describe('Administración - Turnos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/bookings');

    await expect(
      page.getByRole('heading', { name: 'Turnos' }),
    ).toBeVisible();
  });

  test('filtra los turnos por estado', async ({ page }) => {
    await page.getByRole('tab', { name: /Confirmados/ }).click();

    await expect(page.getByText('Cliente Confirmado')).toBeVisible();
    await expect(page.getByText('Cliente Pendiente')).toHaveCount(0);

    await page.getByRole('tab', { name: /Cancelados/ }).click();

    await expect(page.getByText('Cliente Cancelado')).toBeVisible();
    await expect(page.getByText('Cliente Confirmado')).toHaveCount(0);
  });

  test('busca turnos por nombre o teléfono', async ({ page }) => {
    const search = page.getByRole('searchbox', {
      name: 'Buscar por nombre o teléfono',
    });

    await search.fill('Cliente Pendiente');

    await expect(page.getByText('Cliente Pendiente')).toBeVisible();
    await expect(page.getByText('Cliente Confirmado')).toHaveCount(0);

    await page.getByRole('tab', { name: /Todos/ }).click();
    await search.fill('1134567890');

    await expect(page.getByText('Cliente Confirmado')).toBeVisible();
    await expect(page.getByText('Cliente Pendiente')).toHaveCount(0);
  });

  test('confirma un turno pendiente', async ({ page }) => {
    await page.getByRole('button', { name: 'Confirmar' }).click();

    await page.getByRole('tab', { name: /Confirmados/ }).click();

    const row = page.locator('tr').filter({
      hasText: 'Cliente Pendiente',
    });

    await expect(row).toBeVisible();
    await expect(row.locator('.booking-status')).toHaveClass(
      /status-confirmed/,
    );
  });

  test('cancela un turno después de confirmar la acción', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());

    await page.getByRole('button', { name: 'Cancelar' }).click();

    await page.getByRole('tab', { name: /Cancelados/ }).click();

    const row = page.locator('tr').filter({
      hasText: 'Cliente Pendiente',
    });

    await expect(row).toBeVisible();
    await expect(row.locator('.booking-status')).toHaveClass(
      /status-cancelled/,
    );
  });

  test('permite reabrir un turno cancelado', async ({ page }) => {
    await page.getByRole('tab', { name: /Cancelados/ }).click();

    await page.getByRole('button', { name: 'Reabrir' }).click();

    await page.getByRole('tab', { name: /Pendientes/ }).click();

    const row = page.locator('tr').filter({
      hasText: 'Cliente Cancelado',
    });

    await expect(row).toBeVisible();
    await expect(row.locator('.booking-status')).toHaveClass(
      /status-pending/,
    );
  });
});

test.describe('Administración - Horarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/schedule');

    await expect(
      page.getByRole('heading', { name: 'Horarios', exact: true }),
    ).toBeVisible();
  });

  test('muestra los siete días de la semana', async ({ page }) => {
    for (const day of [
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ]) {
      await expect(
        page.getByText(day, { exact: true }),
      ).toBeVisible();
    }
  });

  test('permite habilitar un día cerrado', async ({ page }) => {
    const mondaySwitch = page.locator('#enabled-1');

    await mondaySwitch.check();

    await expect(mondaySwitch).toBeChecked();

    await expect(
      page.getByLabel('Horarios de Lunes'),
    ).toBeEnabled();
  });

  test('deshabilita los horarios cuando se cierra un día', async ({ page }) => {
    const mondaySwitch = page.locator('#enabled-1');

    await mondaySwitch.uncheck();

    await expect(mondaySwitch).not.toBeChecked();

    await expect(
      page.getByLabel('Horarios de Lunes'),
    ).toBeDisabled();
  });

  test('rechaza horarios con formato inválido', async ({ page }) => {
    await page.locator('#enabled-1').check();

    const slotsInput = page.getByLabel('Horarios de Lunes');

    await slotsInput.fill('25:99');

    await page.getByRole('button', { name: 'Guardar' }).first().click();

    await expect(page.getByRole('alert')).toContainText(
      'horarios inválidos',
    );
  });

  test('guarda el horario de un día', async ({ page }) => {
    await page.locator('#enabled-1').check();

    const slotsInput = page.getByLabel('Horarios de Lunes');

    await slotsInput.fill('09:00, 10:00, 11:00');

    const monday = page.locator('.day-row').filter({
      has: page.getByText('Lunes', { exact: true }),
    });

    await monday.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByRole('status')).toContainText(
      'Horario de Lunes guardado.',
    );

    await expect(slotsInput).toHaveValue('09:00, 10:00, 11:00');
  });

  test('permite autocompletar los horarios de un día', async ({ page }) => {
    await page.locator('#enabled-1').check();

    const monday = page.locator('.day-row').filter({
      has: page.getByText('Lunes', { exact: true }),
    });

    await monday.getByRole('button', { name: 'Autocompletar' }).click();

    const slotsInput = page.getByLabel('Horarios de Lunes');

    await expect(slotsInput).not.toHaveValue('');
  });

  test('permite generar horarios para lunes a sábado', async ({ page }) => {
    await page.locator('#genStart').fill('09:00');
    await page.locator('#genEnd').fill('17:00');
    await page.locator('#genStep').fill('60');

    await page.getByRole('button', {
      name: /Aplicar a lunes–sábado/,
    }).click();

    for (const weekday of [1, 2, 3, 4, 5, 6]) {
      const daySwitch = page.locator(`#enabled-${weekday}`);

      await expect(daySwitch).toBeChecked();
    }
  });

  test('permite guardar toda la semana', async ({ page }) => {
    await page.getByRole('button', {
      name: 'Guardar toda la semana',
    }).click();

    await expect(page.getByRole('status')).toBeVisible();
  });
});

test.describe('Administración - Tratamientos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/treatments');

    await expect(
      page.getByRole('heading', {
        name: 'Tratamientos',
        exact: true,
      }),
    ).toBeVisible();
  });

  test('muestra los tratamientos existentes', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: 'Masaje descontracturante',
      }),
    ).toBeVisible();

    await expect(
      page.getByText('Activo', { exact: true }),
    ).toBeVisible();
  });

  test('crea un tratamiento nuevo', async ({ page }) => {
    await page.locator('#name').fill('Masaje de prueba');
    await page.locator('#description').fill('Descripción de prueba');

    await page.locator('#benefits').fill(
      'Primer beneficio\nSegundo beneficio',
    );

    await page.locator('#image').fill('/cards/prueba.jpg');

    await page.getByRole('button', {
      name: 'Guardar tratamiento',
    }).click();

    await expect(
      page.getByRole('heading', { name: 'Masaje de prueba' }),
    ).toBeVisible();

    const treatment = page.locator('.treatment-item').filter({
      hasText: 'Masaje de prueba',
    });

    await expect(treatment).toContainText('Primer beneficio');
    await expect(treatment).toContainText('Segundo beneficio');
  });

  test('rechaza un tratamiento sin nombre', async ({ page }) => {
    await page.locator('#name').fill('   ');

    await page.getByRole('button', {
      name: 'Guardar tratamiento',
    }).click();

    await expect(page.getByRole('alert')).toContainText(
      'Ingresá el nombre del tratamiento.',
    );
  });

  test('edita un tratamiento existente', async ({ page }) => {
    const treatment = page.locator('.treatment-item').filter({
      hasText: 'Masaje descontracturante',
    });

    await treatment.getByRole('button', { name: 'Editar' }).click();

    await expect(
      page.getByRole('heading', { name: 'Editar tratamiento' }),
    ).toBeVisible();

    await page.locator('#name').fill('Masaje actualizado');

    await page.getByRole('button', {
      name: 'Actualizar tratamiento',
    }).click();

    await expect(
      page.getByRole('heading', { name: 'Masaje actualizado' }),
    ).toBeVisible();
  });

  test('da de baja un tratamiento', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());

    const treatment = page.locator('.treatment-item').filter({
      hasText: 'Masaje descontracturante',
    });

    await treatment.getByRole('button', { name: 'Dar de baja' }).click();

    await expect(treatment.getByText('Inactivo')).toBeVisible();

    await expect(
      treatment.getByRole('button', { name: 'Reactivar' }),
    ).toBeVisible();
  });

  test('reactiva un tratamiento inactivo', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());

    const treatment = page.locator('.treatment-item').filter({
      hasText: 'Masaje descontracturante',
    });

    await treatment.getByRole('button', { name: 'Dar de baja' }).click();

    await treatment.getByRole('button', { name: 'Reactivar' }).click();

    await expect(treatment.getByText('Activo')).toBeVisible();
  });
});