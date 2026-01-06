import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isWorking } from '$lib/server/worker';

export const GET: RequestHandler = async () => {
	return json({ working: isWorking() });
};
