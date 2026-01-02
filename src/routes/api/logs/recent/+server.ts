import { json } from '@sveltejs/kit';
import type { RequestHandler } from '../../artists/save/$types';
import { getRecentLogs } from '$lib/server/log';

export const GET: RequestHandler = () => {
	return json(getRecentLogs());
};
