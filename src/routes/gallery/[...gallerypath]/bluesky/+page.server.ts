import type { PageServerLoad } from './$types';
import { readSkipSet } from '$lib/server/bluesky/cache';
import { rawGalleries, readThemeConfig, readThemeSchema } from '@phosart/common/server';

export const load: PageServerLoad = async ({ params }) => {
	const ss = await readSkipSet();
	const gallery = (await rawGalleries())[params.gallerypath];
	const config = await readThemeConfig(await readThemeSchema());
	return {
		ss,
		galleryPath: params.gallerypath,
		gallery,
		config
	};
};
