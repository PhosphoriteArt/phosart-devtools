import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createLogger } from '$lib/util';
const logger = createLogger();

export const GET: RequestHandler = () => {
	const bskyDid = process.env.BSKY_DID;
	const bskyPassword = process.env.BSKY_PASSWORD;
	const bskyUsername = process.env.BSKY_LOGIN;
	if (!bskyDid || !bskyPassword || !bskyUsername) {
		logger.silly('Bluesky not available; missing credentials');
		return json({ available: false });
	}
	logger.silly('Bluesky available');
	return json({ available: true });
};
