import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function login(page, role) {
  await page.goto('/login');
  if (role === 'professor') await page.locator('#tab-professor').click();
  await page.locator('#email').fill(role === 'professor' ? 'profesor@universidad.edu' : 'estudiante@universidad.edu');
  await page.locator('#password').fill('password123');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(role === 'professor' ? /\/profesor$/ : /\/estudiante$/);
  await page.goto('/tareas');
  await expect(page.getByRole('heading', { name: 'Seguimiento académico' })).toBeVisible();
}

test('profesor asigna, estudiante guarda y entrega, profesor revisa y califica entre sesiones', async ({ browser }) => {
  const teacherContext = await browser.newContext();
  const studentContext = await browser.newContext();
  const teacher = await teacherContext.newPage();
  const student = await studentContext.newPage();
  await login(teacher, 'professor');
  await teacher.getByRole('button', { name: 'Asignar Tarea', exact: true }).first().click();
  await teacher.locator('#prof-title').fill('Informe E2E persistente');
  await teacher.locator('#prof-description').fill('Desarrolla el experimento y explica todas las conclusiones obtenidas.');
  await teacher.locator('#prof-dueDate').fill('2099-12-01');
  await teacher.locator('#prof-maxScore').fill('20');
  await teacher.locator('#task-instructions').fill('Describe el procedimiento paso a paso.');
  await teacher.locator('#task-criteria').fill('Rigor experimental y claridad.');
  await teacher.locator('#task-recipients').fill('estudiante@universidad.edu');
  await teacher.locator('input[type=file]').setInputFiles({ name: 'guia.txt', mimeType: 'text/plain', buffer: Buffer.from('Material de apoyo real') });
  await teacher.getByRole('button', { name: 'Publicar Tarea', exact: true }).click();
  await expect(teacher.getByRole('dialog')).toHaveCount(0);
  await login(student, 'student');
  await student.getByRole('button', { name: 'Desarrollar / continuar', exact: true }).click();
  await student.locator('#est-content').fill('Borrador real con observaciones del experimento.');
  await student.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
  await expect(student.getByRole('dialog')).toHaveCount(0);
  await student.reload();
  await expect(student.locator('.tarea-card .status-badge')).toHaveText('En progreso');
  await teacher.reload();
  await teacher.getByRole('button', { name: 'Entregas (0)', exact: true }).click();
  await teacher.getByRole('button', { name: 'Ver avances y entrega' }).click();
  await expect(teacher.getByText('Borrador real con observaciones del experimento.', { exact: true })).toBeVisible();
  await expect(teacher.getByRole('button', { name: 'Guardar Nota' })).toHaveCount(0);
  await teacher.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await student.getByRole('button', { name: 'Desarrollar / continuar', exact: true }).click();
  await expect(student.locator('#est-content')).toHaveValue('Borrador real con observaciones del experimento.');
  await student.locator('#est-content').fill('Respuesta definitiva con resultados y conclusiones verificables.');
  await student.locator('input[type=file]').setInputFiles({ name: 'informe.txt', mimeType: 'text/plain', buffer: Buffer.from('Entrega definitiva real') });
  await student.getByRole('button', { name: 'Confirmar y Entregar', exact: true }).click();
  await expect(student.getByRole('dialog')).toHaveCount(0);
  await teacher.reload();
  await teacher.getByRole('button', { name: 'Entregas (1)', exact: true }).click();
  await teacher.getByRole('button', { name: 'Iniciar revisión' }).click();
  await expect(teacher.getByText(/Entrega en revisión/)).toBeVisible();
  await teacher.locator('#grade-input').fill('18');
  await teacher.locator('#feedback-input').fill('Buen análisis de los resultados experimentales.');
  await teacher.getByRole('button', { name: 'Guardar Nota', exact: true }).click();
  await expect(teacher.getByText('Calificación guardada.', { exact: true })).toBeVisible();
  await student.reload();
  await student.getByRole('button', { name: 'Nota: 18/20', exact: true }).click();
  await expect(student.getByText('Buen análisis de los resultados experimentales.', { exact: true })).toBeVisible();
  const download = student.waitForEvent('download');
  await student.getByRole('button', { name: 'Descargar informe.txt', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('informe.txt');
  await student.screenshot({ path: 'test-results/academic-graded.png', fullPage: true });
  await teacherContext.close(); await studentContext.close();
});

for (const theme of ['light', 'dark']) {
  for (const mobile of [false, true]) {
    test(`tareas y Foro accesibles en ${theme}, ${mobile ? 'móvil' : 'escritorio'}`, async ({ page }) => {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
      await page.addInitScript((value) => localStorage.setItem('disceria_theme_preference', value), theme);
      await login(page, 'professor');
      for (const route of ['/tareas', '/foro']) {
        await page.goto(route);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(result.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) }))).toEqual([]);
        await page.screenshot({ path: `test-results/${route.slice(1)}-${theme}-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
        if (route === '/tareas') {
          await page.getByRole('button', { name: 'Asignar Tarea', exact: true }).first().click();
          const modal = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
          expect(modal.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) }))).toEqual([]);
          await page.getByRole('button', { name: 'Cerrar modal', exact: true }).click();
        }

      }
    });
  }
}
