import type { BaseGallery, RawGallery } from 'phosart-common/util';
import {
	$ART,
	clearCache,
	rawGalleries,
	RawGallery as ZRawGallery,
	type RawGalleryCache
} from 'phosart-common/server';
import type { RequestHandler } from './$types';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import { stringify } from 'yaml';
import { unlink, writeFile } from 'node:fs/promises';
import { getGalleryDir, isBaseGallery, normalizeGalleryPath } from '$lib/galleryutil';
import { createLogger } from '$lib/log';
import { deleteResources } from '$lib/server/fileutil';
const logger = createLogger();

export const POST: RequestHandler = async ({ request, params }) => {
	const galleryPath = normalizeGalleryPath(params.gallerypath);
	const gallery = await ZRawGallery.parseAsync(await request.json());

	const oldGalleries = await rawGalleries();

	logger.info('Saving gallery @', galleryPath, '...');
	await saveGallery(galleryPath, gallery);
	clearCache();
	logger.info('Saved gallery @', galleryPath);

	const newGalleries = await rawGalleries();

	const deletedReferences = getDiffedReferences(oldGalleries, newGalleries);
	if (deletedReferences.size > 0) {
		logger.warn(
			'Found',
			deletedReferences.size,
			'image(s) without references after save. Deleting associated resources...'
		);
		await deleteResources([...deletedReferences]);
	}

	return json({ ok: true });
};

function getDiffedReferences(
	oldGallery: RawGalleryCache,
	newGallery: RawGalleryCache
): Set<string> {
	return getReferences(oldGallery).difference(getReferences(newGallery));
}

function getReferences(gcache: RawGalleryCache): Set<string> {
	let refs = new Set<string>();
	for (const [gpath, gallery] of Object.entries(gcache)) {
		if (!isBaseGallery(gallery)) continue;

		refs = refs.union(getGalleryReferences(gpath, gallery));
	}
	return refs;
}

function getGalleryReferences(galleryPath: string, gallery: BaseGallery): Set<string> {
	const references: Set<string> = new Set();

	const basePath = path.resolve(
		path.join($ART(), getGalleryDir(normalizeGalleryPath(galleryPath)))
	);

	for (const piece of gallery.pieces) {
		references.add(path.resolve(path.join(basePath, piece.image)));
		if (piece.video) {
			references.add(path.resolve(path.join(basePath, piece.video.full)));
			references.add(path.resolve(path.join(basePath, piece.video.thumb)));
		}
		if (piece.alts) {
			for (const alt of piece.alts) {
				references.add(path.resolve(path.join(basePath, alt.image)));
				if (alt.video) {
					references.add(path.resolve(path.join(basePath, alt.video.full)));
					references.add(path.resolve(path.join(basePath, alt.video.thumb)));
				}
			}
		}
	}

	return references;
}

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
	const oldGalleries = await rawGalleries();
	logger.info('Deleting gallery @', gpath, '...');
	await unlink(gpath);
	clearCache();
	logger.info('Deleted gallery @', gpath);

	const newGalleries = await rawGalleries();

	const deletedReferences = getDiffedReferences(oldGalleries, newGalleries);
	if (deletedReferences.size > 0) {
		logger.warn(
			'Found',
			deletedReferences.size,
			'image(s) without references after save. Deleting associated resources...'
		);
		await deleteResources([...deletedReferences]);
	}

	return json({ ok: true });
};
