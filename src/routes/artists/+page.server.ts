import { artists } from '@phosart/common/server';
import type { PageServerLoad } from './$types';
import { createLogger } from '$lib/log';
const logger = createLogger();

export const prerender = false;

export const load: PageServerLoad = async () => {
	logger.silly('Loading artists page data');
	const allArtists = await artists();
	logger.silly('Loaded artists page data:', Object.keys(allArtists).length, 'artists');
	return {
		artists: allArtists
	};
};
