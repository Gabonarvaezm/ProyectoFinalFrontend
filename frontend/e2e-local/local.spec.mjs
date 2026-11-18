import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const teacher = { name: 'Docente Local', email: 'docente@demo.edu', role: 'professor' };
const student = { name: 'Alumna Local', email: 'alumna@demo.edu', role: 'student' };
async function register(page, profile) {
  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#password')).toHaveCount(0);
  await page.locator('#fullName').fill(profile.name);
  await page.locator('#email').fill(profile.email);
  await page.locator('#institution').fill('Colegio Demostración');
  await page.locator('#role').selectOption(profile.role);
  await page.locator('#acceptTerms').check();
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(/\/login$/);
}
async function login(page, profile) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  if (profile.role === 'professor') await page.locator('#tab-professor').click();
  await expect(page.locator('#password')).toHaveCount(0);
  await page.locator('#email').fill(profile.email);
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(profile.role === 'professor' ? /\/profesor$/ : /\/estudiante$/);
}
async function logout(page) {
  await page.goto('/configuracion', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Cerrar sesión actual de DiscerIA' }).click();
  await page.getByRole('button', { name: 'Sí, Cerrar Sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
}

test.beforeEach(async ({ page }) => {
  page.academicRequests = [];
  await page.route('https://**/*', (route) => route.abort());
  page.on('request', (request) => { if (request.url().includes('/api/academic')) page.academicRequests.push(request.url()); });
  await page.route('**/api/academic/**', (route) => route.abort());
});
test.afterEach(async ({ page }) => { expect(page.academicRequests, 'No debe haber solicitudes académicas en modo local').toEqual([]); });

test('registro, sesiones, borrador, corrección, nota y persistencia local sin API', async ({ page }) => {
  await register(page, teacher); await register(page, student);
  await login(page, teacher);
  await page.getByRole('button', { name: 'Gestionar tareas', exact: true }).click();
  await expect(page).toHaveURL(/\/tareas$/);
  await page.getByRole('button', { name: 'Asignar Tarea', exact: true }).first().click();
  await page.locator('#prof-title').fill('Experimento local persistente');
  await page.locator('#prof-description').fill('Describe las observaciones y conclusiones del experimento.');
  await page.locator('#prof-dueDate').fill('2099-12-01');
  await page.locator('#prof-maxScore').fill('20');
  await page.locator('#task-recipients').fill(student.email);
  await page.locator('input[type=file]').setInputFiles({ name: 'guia.txt', mimeType: 'text/plain', buffer: Buffer.from('Guía local persistente') });
  await page.getByRole('button', { name: 'Publicar Tarea', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await logout(page); await login(page, student); await page.goto('/tareas', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Desarrollar / continuar', exact: true }).click();
  await page.locator('#est-content').fill('Borrador guardado solo en este navegador.');
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Desarrollar / continuar', exact: true }).click();
  await expect(page.locator('#est-content')).toHaveValue('Borrador guardado solo en este navegador.');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await logout(page); await login(page, teacher); await page.goto('/tareas', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Entregas (0)', exact: true }).click();
  await page.getByRole('button', { name: 'Ver avances y entrega' }).click();
  await expect(page.getByText('Borrador guardado solo en este navegador.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar Nota' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await logout(page); await login(page, student); await page.goto('/tareas', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Desarrollar / continuar', exact: true }).click();
  await page.locator('#est-content').fill('Entrega final con todas las conclusiones experimentales.');
  await page.locator('input[type=file]').setInputFiles({ name: 'informe.txt', mimeType: 'text/plain', buffer: Buffer.from('Archivo final local') });
  await page.getByRole('button', { name: 'Confirmar y Entregar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await logout(page); await login(page, teacher); await page.goto('/tareas', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Entregas (1)', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar revisión', exact: true }).click();
  await page.locator('#feedback-input').fill('Amplía las conclusiones del experimento.');
  await page.getByRole('button', { name: 'Solicitar corrección con estos comentarios' }).click();
  await expect(page.getByText('Nueva entrega autorizada.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await logout(page); await login(page, student); await page.goto('/tareas', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Desarrollar / continuar', exact: true }).click();
  await expect(page.getByText('Amplía las conclusiones del experimento.', { exact: false })).toBeVisible();
  await page.locator('#est-content').fill('Entrega corregida con conclusiones ampliadas y verificadas.');
  await page.getByRole('button', { name: 'Confirmar y Entregar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await logout(page); await login(page, teacher); await page.goto('/tareas', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Entregas (1)', exact: true }).click();
  await page.locator('#grade-input').fill('18');
  await page.locator('#feedback-input').fill('Buen análisis experimental y conclusiones correctas.');
  await page.getByRole('button', { name: 'Guardar Nota', exact: true }).click();
  await expect(page.getByText('Calificación guardada.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(page.getByText(/Cumplimiento: 100.0%/)).toBeVisible();
  await logout(page); await login(page, student); await page.goto('/tareas', { waitUntil: 'domcontentloaded' }); await page.reload();
  await page.getByRole('button', { name: 'Nota: 18/20', exact: true }).click();
  await expect(page.getByText('Buen análisis experimental y conclusiones correctas.', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar informe.txt', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('informe.txt');
  await page.screenshot({ path: 'test-results-local/flujo-local-calificado.png', fullPage: true });
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await logout(page);
  await page.goto('/tareas', { waitUntil: 'domcontentloaded' }); await expect(page).toHaveURL(/\/login$/);
  await register(page, { name: 'Otra Alumna', email: 'otra@demo.edu', role: 'student' });
  await login(page, { email: 'otra@demo.edu', role: 'student' }); await page.goto('/tareas', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Experimento local persistente', exact: true })).toHaveCount(0);
  await page.goto('/profesor', { waitUntil: 'domcontentloaded' }); await expect(page).toHaveURL(/\/estudiante$/);
  const local = await page.evaluate(() => localStorage.getItem('disceria_local_academic_v1'));
  expect(local).not.toContain('password');
});

for (const theme of ['light', 'dark']) {
  test(`apariencia local ${theme} en Foro, Biblioteca, Tareas y dashboards`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('disceria_theme_preference', value), theme);
    const teacherDemo = { email: 'profesor@universidad.edu', role: 'professor' };
    const studentDemo = { email: 'estudiante@universidad.edu', role: 'student' };
    await login(page, teacherDemo);
    for (const mobile of [false, true]) {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
      for (const route of ['/foro', '/biblioteca', '/tareas', '/profesor']) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(page.locator('h1').first()).toBeVisible();
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth ? [] : [...document.querySelectorAll('body *')].filter((element) => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map((element) => ({ tag: element.tagName, class: element.className, right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width })))).toEqual([]);
        if (route === '/foro' || route === '/tareas') {
          const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
          expect(result.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) }))).toEqual([]);
        }
        await page.screenshot({ path: `test-results-local/${route.slice(1)}-${theme}-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
      }
    }
    await logout(page); await login(page, studentDemo);
    await page.goto('/estudiante', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth ? [] : [...document.querySelectorAll('body *')].filter((element) => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map((element) => ({ tag: element.tagName, class: element.className, right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width })))).toEqual([]);
    const exam = await new AxeBuilder({ page }).include('.practice-exam-card').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(exam.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) }))).toEqual([]);
    await page.screenshot({ path: `test-results-local/estudiante-${theme}-mobile.png`, fullPage: true });
  });
}
