import { join } from 'node:path/posix';
import { $ART, rawGalleries } from 'phosart-common/server';
import { error } from '@sveltejs/kit';
import { getGalleryDir, isBaseGallery } from '$lib/galleryutil';
import type { BaseResource } from '$lib/util';

export async function getOriginalImagePath(
	galleryPath: string,
	pieceSlug: string,
	{
		video,
		thumb,
		alt,
		altIndex
	}: { video?: boolean; thumb?: boolean; alt?: string; altIndex?: number } = {}
): Promise<string | Response> {
	const gallery = (await rawGalleries())[galleryPath];
	if (!isBaseGallery(gallery)) {
		return error(404, 'gallery not found');
	}

	const piece = gallery.pieces.find((p) => p.slug === pieceSlug);
	if (!piece) {
		return error(404, 'piece not found');
	}

	const getResource = (resource: BaseResource): string | null => {
		if (!video) {
			return resource.image;
		}

		return (thumb ? (resource.video?.thumb ?? resource.video?.full) : resource.video?.full) ?? null;
	};

	let resourceUrl = getResource(piece);
	if (!resourceUrl) {
		return error(404, 'resource not found pt. 1');
	}

	if (alt || (altIndex ?? -1) >= 0) {
		const altPei = piece?.alts?.find((a) => a.name === alt) ?? piece?.alts?.[altIndex ?? -1];
		if (!altPei) {
			return error(404, 'alt not found');
		}
		resourceUrl = getResource(altPei);
	}

	if (!resourceUrl) {
		return error(404, 'resourceUrl not found pt 2.');
	}

	return join($ART(), getGalleryDir(galleryPath), resourceUrl);
}
