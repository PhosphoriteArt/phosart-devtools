import { sync } from '$lib/server/bluesky/sync';
import type { PageServerLoad } from './$types';
import { readSkipSet } from '$lib/server/bluesky/cache';
import { rawGalleries, readThemeConfig, readThemeSchema } from 'phosart-common/server';

export const load: PageServerLoad = async ({ params }) => {
	const result = await sync();
	if (Array.isArray(result)) {
		return {
			posts: result,
			ss: await readSkipSet(),
			galleryPath: params.gallerypath,
			gallery: (await rawGalleries())[params.gallerypath],
			config: await readThemeConfig(await readThemeSchema())
		};
	}
	throw result;
};
