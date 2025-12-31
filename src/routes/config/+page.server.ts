import { artists, readThemeConfig, readThemeSchema } from 'phosart-common/server';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async () => {
	const themeSchema = await readThemeSchema();
	const themeConfig = await readThemeConfig(themeSchema);

	return { themeSchema, themeConfig, artists: Object.keys(await artists()) };
};
