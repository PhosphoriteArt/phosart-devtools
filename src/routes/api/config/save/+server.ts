import { clearCache, readThemeSchema, writeThemeConfig } from 'phosart-common/server';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	await writeThemeConfig(await readThemeSchema(), await request.json());
	clearCache();

	return json({ ok: true });
};
