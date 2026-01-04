import { $ART } from '@phosart/common/server';
import type { RequestHandler } from './$types';
import path from 'node:path';
import { error, json } from '@sveltejs/kit';
import { normalizeGalleryPath } from '$lib/galleryutil';
import { mkdir } from 'node:fs/promises';
import { createLogger } from '$lib/log';
import { resolveWithinArt } from '$lib/server/fileutil';
const logger = createLogger();

export const PATCH: RequestHandler = async ({ params }) => {
	const folderPath = normalizeGalleryPath(params.folderpath);
	const fullPath = resolveWithinArt(path.join($ART(), folderPath));
	if (!fullPath) {
		logger.warn('Refusing to create folder outside art root @', folderPath);
		throw error(400, 'invalid folder path');
	}
	logger.debug('Creating folder @', fullPath, '...');

	await mkdir(fullPath, { recursive: true });
	logger.info('Created folder @', fullPath);

	return json({ ok: true });
};
