import { galleries } from 'phosart-common/server';
import type { LayoutServerLoad } from './$types';
import { normalizeGalleryPath } from '$lib/galleryutil';

export const prerender = false;

export const load: LayoutServerLoad = async () => {
	const galleryPaths = Object.keys(await galleries());
	const onlyPath = galleryPaths.length === 1 ? galleryPaths[0] : null;
	return {
		redirectGallery: normalizeGalleryPath(onlyPath) || null
	};
};
