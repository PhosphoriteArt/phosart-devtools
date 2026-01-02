import { rawGalleries } from 'phosart-common/server';
import type { LayoutServerLoad } from './$types';
import { normalizeGalleryPath } from '$lib/galleryutil';
import { createLogger } from '$lib/util';
const logger = createLogger();

export const prerender = false;

export const load: LayoutServerLoad = async () => {
	logger.silly('Loading layout data');
	const galleryPaths = Object.keys(await rawGalleries());
	const onlyPath = galleryPaths.length === 1 ? galleryPaths[0] : null;
	logger.silly('Loaded layout data');
	return {
		redirectGallery: normalizeGalleryPath(onlyPath) || null,
		previewPort: getPreviewPort()
	};
};

function getPreviewPort() {
	try {
		if (!process.env.PREVIEWPORT) {
			return null;
		}
		return parseInt(process.env.PREVIEWPORT);
	} catch {
		return null;
	}
}
