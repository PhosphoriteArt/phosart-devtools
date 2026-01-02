import type { RawGallery } from 'phosart-common/util';
import { $ART, clearCache, RawGallery as ZRawGallery } from 'phosart-common/server';
import type { RequestHandler } from './$types';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import { stringify } from 'yaml';
import { unlink, writeFile } from 'node:fs/promises';
import { isBaseGallery, normalizeGalleryPath } from '$lib/galleryutil';
import { createLogger } from '$lib/util';
const logger = createLogger();

export const POST: RequestHandler = async ({ request, params }) => {
	const galleryPath = normalizeGalleryPath(params.gallerypath);
	const gallery = await ZRawGallery.parseAsync(await request.json());

	logger.info('Saving gallery @', galleryPath, '...');
	await saveGallery(galleryPath, gallery);
	clearCache();
	logger.info('Saved gallery @', galleryPath);

	return json({ ok: true });
};

async function saveGallery(galleryPath: string, newGallery: RawGallery) {
	if (isBaseGallery(newGallery)) {
		for (const p of newGallery.pieces) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			delete (p as unknown as any).slug;
		}
	}

	const galleryFullPath = path.join($ART(), galleryPath);
	logger.silly('Writing gallery yaml @', galleryFullPath, '...');
	const yaml = stringify(newGallery, {
		blockQuote: true,
		collectionStyle: 'block',
		defaultKeyType: 'PLAIN',
		defaultStringType: 'PLAIN',
		indent: 2
	});
	await writeFile(galleryFullPath, yaml, { encoding: 'utf-8' });
	logger.debug('Wrote gallery yaml @', galleryFullPath);
}

export const DELETE: RequestHandler = async ({ params }) => {
	const galleryPath = normalizeGalleryPath(params.gallerypath);
	const gpath = path.join($ART(), galleryPath);
	logger.info('Deleting gallery @', gpath, '...');
	await unlink(gpath);
	clearCache();
	logger.info('Deleted gallery @', gpath);

	return json({ ok: true });
};
