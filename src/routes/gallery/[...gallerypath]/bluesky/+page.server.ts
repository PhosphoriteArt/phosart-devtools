import { sync } from '$lib/server/bluesky/sync';
import type { PageServerLoad } from './$types';
import { readSkipSet } from '$lib/server/bluesky/cache';
import { rawGalleries, readThemeConfig, readThemeSchema } from 'phosart-common/server';

export const load: PageServerLoad = async ({ params }) => {
	const ss = await readSkipSet();
	const gallery = (await rawGalleries())[params.gallerypath];
	const config = await readThemeConfig(await readThemeSchema());
	const result = await sync();
	if (Array.isArray(result)) {
		return {
			posts: result,
			ss,
			galleryPath: params.gallerypath,
			gallery,
			config
		};
	}
	throw result;
};
