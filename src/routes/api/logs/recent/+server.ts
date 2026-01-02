import { json } from '@sveltejs/kit';
import type { RequestHandler } from '../../artists/save/$types';
import { getRecentLogs } from '$lib/log';

export const GET: RequestHandler = () => {
	return json(getRecentLogs());
};
