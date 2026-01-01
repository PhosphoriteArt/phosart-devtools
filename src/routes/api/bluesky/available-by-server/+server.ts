import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const bskyDid = process.env.BSKY_DID;
	const bskyPassword = process.env.BSKY_PASSWORD;
	const bskyUsername = process.env.BSKY_LOGIN;
	if (!bskyDid || !bskyPassword || !bskyUsername) {
		return json({ available: false });
	}
	return json({ available: true });
};
