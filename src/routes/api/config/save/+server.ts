import { clearCache, readThemeSchema, writeThemeConfig } from 'phosart-common/server';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createLogger } from '$lib/util';
const logger = createLogger()

export const POST: RequestHandler = async ({ request }) => {
	await writeThemeConfig(await readThemeSchema(), await request.json());
	clearCache();

	return json({ ok: true });
};
