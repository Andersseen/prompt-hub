import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Dashboard', () => {
  test('opens the local-first dashboard', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Prompt Hub' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agents' })).toBeVisible();
    await expect(page.getByText('Local Storage')).toBeVisible();
  });

  test('passes axe accessibility checks on the dashboard shell', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe('Agent workflow', () => {
  test('creates a new agent and sees it in the list', async ({ page }) => {
    await page.goto('/agents');

    // Wait for the workspace to load
    await expect(page.getByText('Angular Development Assistant')).toBeVisible();

    // Click "New Agent" in the list panel
    const newAgentButton = page.locator('app-agent-list').getByRole('button', { name: /new agent/i });
    await newAgentButton.click();

    // The editor should show "New Agent"
    await expect(page.locator('app-agent-editor').getByText('Agent Editor')).toBeVisible();

    // Fill the name
    const nameInput = page.locator('app-agent-editor').locator('input[name="agentName"], volt-input[name="agentName"] input, [name="agentName"]').first();
    await nameInput.fill('Test Agent');

    // Save
    const saveButton = page.locator('app-agent-editor').getByRole('button', { name: 'Save' });
    await saveButton.click();

    // Toast should appear
    await expect(page.getByText('Agent saved.')).toBeVisible();

    // The new agent should appear in the list
    await expect(page.locator('app-agent-list').getByText('Test Agent')).toBeVisible();
  });
});

test.describe('Export / Import workflow', () => {
  test('exports workspace as JSON', async ({ page }) => {
    await page.goto('/import-export');

    await expect(page.getByText('Export Workspace')).toBeVisible();

    // Click JSON export
    await page.getByRole('button', { name: 'JSON' }).click();

    // The export textarea should contain valid JSON
    const exportTextarea = page.locator('textarea[name="exportText"]');
    await expect(exportTextarea).toContainText('"schemaVersion"');
    await expect(exportTextarea).toContainText('"roles"');
  });
});

test.describe('Dirty check', () => {
  test('warns when leaving with unsaved changes', async ({ page }) => {
    await page.goto('/agents');

    // Wait for load
    await expect(page.getByText('Angular Development Assistant')).toBeVisible();

    // Click on the first agent to edit
    await page.locator('app-agent-list').getByText('Angular Development Assistant').first().click();

    // Modify the name
    const nameInput = page.locator('app-agent-editor').locator('input').first();
    await nameInput.fill('Modified Agent Name');

    // Try to navigate away
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('unsaved changes');
      dialog.dismiss().catch(() => { /* noop */ });
    });

    await page.getByRole('link', { name: 'Skills' }).click();

    // Because we dismissed the dialog, we should still be on the agents page
    await expect(page).toHaveURL(/\/agents/);
  });
});
