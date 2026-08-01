import { test, expect } from '@playwright/test';

test.describe('Playwright E2E Critical Smoke Tests', () => {
  test('TC-E2E-SMK-01: verifies login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Apex/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
