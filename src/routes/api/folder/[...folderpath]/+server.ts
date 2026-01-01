import { $ART } from 'phosart-common/server';
import type { RequestHandler } from './$types';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import { normalizeGalleryPath } from '$lib/galleryutil';
import { mkdir } from 'node:fs/promises';

export const PATCH: RequestHandler = async ({ params }) => {
	const folderPath = normalizeGalleryPath(params.folderpath);

	await mkdir(path.join($ART(), folderPath), { recursive: true });

	return json({ ok: true });
};
