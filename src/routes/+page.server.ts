import { $ART, artists, rawGalleries } from 'phosart-common/server';
import type { PageServerLoad } from './$types';
import { search } from '$lib/server/structure';
import { normalizeGalleryPath } from '$lib/galleryutil';
import { createLogger } from '$lib/util';
const logger = createLogger();

export const prerender = false;

export const load: PageServerLoad = async () => {
	logger.silly('Loading home page data');
	const galleryPaths = Object.keys(await rawGalleries());
	const onlyPath = galleryPaths.length === 1 ? galleryPaths[0] : null;
	const gallerySearch = await search($ART(), await rawGalleries(), await artists());
	logger.silly('Loaded home page data');
	return {
		galleries: gallerySearch,
		redirectGallery: normalizeGalleryPath(onlyPath) || null
	};
};
