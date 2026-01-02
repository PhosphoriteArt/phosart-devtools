import { clearCache, readThemeSchema, writeThemeConfig } from 'phosart-common/server';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createLogger } from '$lib/log';
const logger = createLogger();

export const POST: RequestHandler = async ({ request }) => {
	logger.debug('Saving theme config...');
	await writeThemeConfig(await readThemeSchema(), await request.json());
	clearCache();
	logger.info('Saved theme config');

	return json({ ok: true });
};
