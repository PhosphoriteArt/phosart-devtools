import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sync } from '$lib/server/bluesky/sync';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const result = await sync(await request.json());
		if (Array.isArray(result)) {
			return json(result);
		}
		return result;
	} catch (error) {
		return json({ message: String(error) }, { status: 500 });
	}
};
