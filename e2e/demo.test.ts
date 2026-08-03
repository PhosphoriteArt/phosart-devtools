import { expect, test } from '@playwright/test';

test('home page has expected New Page button', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'New Folder' })).toBeVisible();
});
