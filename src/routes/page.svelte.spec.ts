import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render New Folder button', async () => {
		render(Page, {
			data: {
				galleryPaths: [],
				bskyAvailable: false,
				galleries: {},
				previewPort: null,
				redirectGallery: null,
				tree: { $type: 'folder', items: 0, structure: {} }
			}
		});

		const button = page.getByText('New Folder').nth(1);
		await expect.element(button).toBeInTheDocument();
	});
});
