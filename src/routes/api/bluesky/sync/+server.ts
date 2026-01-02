import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sync } from '$lib/server/bluesky/sync';
import { createLogger } from '$lib/util';
const logger = createLogger()

export const POST: RequestHandler = async ({ request }) => {
	const result = await sync(await request.json());
	if (Array.isArray(result)) {
		return json(result);
	}
	return result;
};
