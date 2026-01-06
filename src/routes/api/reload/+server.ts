import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { reload } from '$lib/server/fileutil';

export const POST: RequestHandler = async () => {
	await reload();
	return json({ ok: true });
};
