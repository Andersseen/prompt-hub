import { expect, test } from '@playwright/test';

test('opens the local-first dashboard', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Prompt Hub' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Agents' })).toBeVisible();
  await expect(page.getByText('Your data is stored locally in this browser.')).toBeVisible();
});
