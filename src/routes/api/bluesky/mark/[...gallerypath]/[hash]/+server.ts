import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readSkipSet, writeSkipSet } from '$lib/server/bluesky/cache';
import { createLogger } from '$lib/util';
const logger = createLogger();

export const DELETE: RequestHandler = async ({ params }) => {
	logger.debug('Removing skipset hash', params.hash, '@', params.gallerypath, '...');
	const ss = await readSkipSet();
	ss[params.gallerypath] = ss[params.gallerypath] ?? new Set();
	ss[params.gallerypath].delete(params.hash);
	await writeSkipSet(ss);
	logger.info('Removed skipset hash', params.hash, '@', params.gallerypath);
	return json({ ok: true });
};
export const PUT: RequestHandler = async ({ params }) => {
	logger.debug('Adding skipset hash', params.hash, '@', params.gallerypath, '...');
	const ss = await readSkipSet();
	ss[params.gallerypath] = ss[params.gallerypath] ?? new Set();
	ss[params.gallerypath].add(params.hash);
	await writeSkipSet(ss);
	logger.info('Added skipset hash', params.hash, '@', params.gallerypath);
	return json({ ok: true });
};
