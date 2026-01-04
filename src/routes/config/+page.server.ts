import { allPieces, artists, readThemeConfig, readThemeSchema } from '@phosart/common/server';
import type { PageServerLoad } from './$types';
import { createLogger } from '$lib/log';
const logger = createLogger();

export const load: PageServerLoad = async () => {
	logger.silly('Loading config page data');
	const themeSchema = await readThemeSchema();
	const themeConfig = await readThemeConfig(themeSchema);
	const allArtists = await artists();
	logger.silly('Loaded config page data');

	return {
		themeSchema,
		themeConfig,
		artists: Object.keys(allArtists),
		allTags: Object.values(await allPieces()).flatMap((p) => p.tags)
	};
};
