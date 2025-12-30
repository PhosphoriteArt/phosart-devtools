import { $ART, artists, characters, galleries } from 'phosart-common/server';
import type { PageServerLoad } from './$types';
import { search } from '$lib/server/structure';
import { normalizeGalleryPath } from '$lib/galleryutil';

export const prerender = false;

export const load: PageServerLoad = async () => {
	const galleryPaths = Object.keys(await galleries());
	const onlyPath = galleryPaths.length === 1 ? galleryPaths[0] : null;
	return {
		galleries: await search($ART, await galleries(), await characters(), await artists()),
		redirectGallery: normalizeGalleryPath(onlyPath) || null
	};
};
