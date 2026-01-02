import { rawCharacters } from 'phosart-common/server';
import type { PageServerLoad } from './$types';
import { createLogger } from '$lib/util';
const logger = createLogger()

export const prerender = false;

export const load: PageServerLoad = async () => {
	return {
		characters: await rawCharacters()
	};
};
