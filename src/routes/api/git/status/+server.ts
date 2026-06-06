import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { status } from '$lib/server/gitops/git';

export const GET: RequestHandler = async () => {
	try {
		return json(await status());
	} catch (error) {
		return json(
			{
				message: String(error)
			},
			{ status: 500 }
		);
	}
};
