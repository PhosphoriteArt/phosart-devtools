import { $ART, artists, rawGalleries } from 'phosart-common/server';
import type { PageServerLoad } from './$types';
import { search } from '$lib/server/structure';
import { normalizeGalleryPath } from '$lib/galleryutil';

export const prerender = false;

export const load: PageServerLoad = async () => {
	const galleryPaths = Object.keys(await rawGalleries());
	const onlyPath = galleryPaths.length === 1 ? galleryPaths[0] : null;
	const x = {
		galleries: await search($ART(), await rawGalleries(), await artists()),
		redirectGallery: normalizeGalleryPath(onlyPath) || null
	};

	console.log(x);

	return x;
};
