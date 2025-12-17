const { test, expect } = require('@playwright/test');

// =========================
// LOGIN ADMIN
// =========================
test('Login como administrador', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input[name="username"]', '1023458967');
  await page.fill('input[name="password"]', '5uecia2025*');
  await page.getByRole('button', { name: 'Acceder' }).click();

  await expect(page).toHaveURL(/dashboardAdmin\.html/);
  await expect(page.locator('h1')).toBeVisible();
});

// =========================
// LOGIN CAJERO
// =========================
test('Login como cajero', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input[name="username"]', '1026859748');
  await page.fill('input[name="password"]', 'Holanda2025/');
  await page.getByRole('button', { name: 'Acceder' }).click();

  await expect(page).toHaveURL(/cajero\/dashboard/);
  await expect(page.locator('h1')).toBeVisible();
});

// =========================
// LOGIN MESERO
// =========================
test('Login como mesero', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input[name="username"]', '19432665');
  await page.fill('input[name="password"]', 'Supp0rtX4M1992#');
  await page.getByRole('button', { name: 'Acceder' }).click();

  await expect(page).toHaveURL(/mesero\/dashboard/);
  await expect(page.locator('h1')).toBeVisible();
});