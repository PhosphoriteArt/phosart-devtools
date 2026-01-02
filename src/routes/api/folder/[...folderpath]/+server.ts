import { $ART } from 'phosart-common/server';
import type { RequestHandler } from './$types';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import { normalizeGalleryPath } from '$lib/galleryutil';
import { mkdir } from 'node:fs/promises';
import { createLogger } from '$lib/log';
const logger = createLogger();

export const PATCH: RequestHandler = async ({ params }) => {
	const folderPath = normalizeGalleryPath(params.folderpath);
	const fullPath = path.join($ART(), folderPath);
	logger.debug('Creating folder @', fullPath, '...');

	await mkdir(fullPath, { recursive: true });
	logger.info('Created folder @', fullPath);

	return json({ ok: true });
};
