import {
	artists,
	characters,
	cleanUnusedHashes,
	clearCache,
	clearProcessedHashes,
	galleries
} from '@phosart/common/server';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async () => {
	clearProcessedHashes();
	clearCache();
	await galleries();
	await characters();
	await artists();
	await cleanUnusedHashes();

	return json({ ok: true });
};
