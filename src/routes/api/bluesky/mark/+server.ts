import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readSkipSet, writeSkipSet } from '$lib/server/bluesky/cache';
import { createLogger } from '$lib/log';
const logger = createLogger();

export const PATCH: RequestHandler = async ({ url, request }) => {
	const body: Record<string, string[]> | string[] = await request.json();
	const gpath = url.searchParams.get('gallerypath');
	if (gpath) {
		logger.debug(
			'Adding',
			(body as string[]).length,
			'skipset entries for gallery @',
			gpath,
			'...'
		);
		const ss = await readSkipSet();
		ss[gpath] = new Set([...(body as string[]), ...(ss[gpath] ?? [])]);
		await writeSkipSet(ss);
		logger.info('Updated skipset for gallery @', gpath);
		return json({ ok: true });
	}

	logger.debug('Replacing entire skipset...');
	await writeSkipSet(Object.fromEntries(Object.entries(body).map(([k, v]) => [k, new Set(v)])));
	logger.info('Replaced entire skipset');
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ url }) => {
	const gpath = url.searchParams.get('gallerypath');
	if (gpath) {
		logger.debug('Removing skipset for gallery @', gpath, '...');
		const ss = await readSkipSet();
		if (gpath in ss) {
			delete ss[gpath];
		}
		await writeSkipSet(ss);
		logger.info('Removed skipset for gallery @', gpath);
		return json({ ok: true });
	}

	logger.info('Clearing entire skipset...');
	await writeSkipSet({});
	logger.info('Cleared entire skipset');
	return json({ ok: true });
};
