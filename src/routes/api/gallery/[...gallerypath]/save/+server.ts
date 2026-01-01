import type { RawGallery } from 'phosart-common/util';
import { $ART, clearCache, RawGallery as ZRawGallery } from 'phosart-common/server';
import type { RequestHandler } from './$types';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import { stringify } from 'yaml';
import { writeFile } from 'node:fs/promises';
import { isBaseGallery, normalizeGalleryPath } from '$lib/galleryutil';

export const POST: RequestHandler = async ({ request, params }) => {
	const galleryPath = normalizeGalleryPath(params.gallerypath);
	const gallery = await ZRawGallery.parseAsync(await request.json());

	await saveGallery(galleryPath, gallery);
	clearCache();

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
	const yaml = stringify(newGallery, {
		blockQuote: true,
		collectionStyle: 'block',
		defaultKeyType: 'PLAIN',
		defaultStringType: 'PLAIN',
		indent: 2
	});
	await writeFile(galleryFullPath, yaml, { encoding: 'utf-8' });
}
