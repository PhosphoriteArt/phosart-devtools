import { join } from 'node:path';
import type { RequestHandler } from './$types';
import { $ART, rawGalleries } from 'phosart-common/server';
import { error } from '@sveltejs/kit';
import { open } from 'node:fs/promises';
import { asWebStream } from '$lib/server/fileutil';
import { getGalleryDir, isBaseGallery, normalizeGalleryPath } from '$lib/galleryutil';
import type { BaseResource } from '$lib/util';

export const GET: RequestHandler = async ({ params, url }) => {
	const galleryPath = normalizeGalleryPath(params.gallerypath);
	const gallery = (await rawGalleries())[galleryPath];
	if (!isBaseGallery(gallery)) {
		return error(404);
	}

	const piece = gallery.pieces.find((p) => p.slug === params.piece);
	if (!piece) {
		return error(404);
	}

	const getResource = (resource: BaseResource): string | null => {
		if (url.searchParams.get('video') !== 'true') {
			return resource.image;
		}

		return (
			(url.searchParams.get('thumb') === 'true'
				? (resource.video?.thumb ?? resource.video?.full)
				: resource.video?.full) ?? null
		);
	};

	let resourceUrl = getResource(piece);
	if (!resourceUrl) {
		return error(404);
	}

	const alt = url.searchParams.get('alt');
	let altIndex: number = -1;
	const altIndexS = url.searchParams.get('altIndex');
	if (altIndexS) {
		try {
			altIndex = parseInt(altIndexS);
		} catch {
			// ignore
		}
	}
	if (alt || altIndex >= 0) {
		const altPei = piece?.alts?.find((a) => a.name === alt) ?? piece?.alts?.[altIndex];
		if (!altPei) {
			return error(404);
		}
		resourceUrl = getResource(altPei);
	}

	if (!resourceUrl) {
		return error(404);
	}

	const path = join($ART, getGalleryDir(galleryPath), resourceUrl);
	const file = await open(path);

	return new Response(asWebStream(file.createReadStream({ autoClose: true })), {
		status: 200,
		headers: {}
	});
};
