import { rawCharacters } from 'phosart-common/server';
import type { PageServerLoad } from './$types';
import { createLogger } from '$lib/util';
const logger = createLogger();

export const prerender = false;

export const load: PageServerLoad = async () => {
	logger.silly('Loading characters page data');
	const allCharacters = await rawCharacters();
	logger.silly('Loaded characters page data:', Object.keys(allCharacters).length, 'characters');
	return {
		characters: allCharacters
	};
};
