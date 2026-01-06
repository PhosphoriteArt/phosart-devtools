import type { RequestHandler } from './$types';
import { open } from 'node:fs/promises';
import { asWebStream } from '$lib/server/fileutil';
import { normalizeGalleryPath } from '$lib/galleryutil';
import { getOriginalImagePath } from './util';
import { createLogger } from '$lib/log';
import mime from 'mime';
const logger = createLogger();

export const GET: RequestHandler = async ({ params, url }) => {
	const galleryPath = normalizeGalleryPath(params.gallerypath);
	const pieceSlug = params.piece;
	const video = url.searchParams.get('video') === 'true';
	const thumb = url.searchParams.get('thumb') === 'true';
	const alt = url.searchParams.get('alt') ?? undefined;
	let altIndex: number = -1;
	const altIndexS = url.searchParams.get('altIndex');
	if (altIndexS) {
		try {
			altIndex = parseInt(altIndexS);
		} catch {
			// ignore
		}
	}
	logger.silly(
		'Fetching original image',
		'gallery',
		galleryPath,
		'piece',
		pieceSlug,
		'video?',
		video,
		'thumb?',
		thumb,
		'alt?',
		alt ?? 'none',
		'altIndex',
		altIndex
	);
	const path = await getOriginalImagePath(galleryPath, pieceSlug, { video, thumb, alt, altIndex });
	if (typeof path !== 'string') {
		return path;
	}

	logger.silly('Serving original image @', path);
	const file = await open(path);

	return new Response(asWebStream(file.createReadStream({ autoClose: true })), {
		status: 200,
		headers: {
			'Content-Type': mime.getType(path) ?? 'application/octet-stream'
		}
	});
};
