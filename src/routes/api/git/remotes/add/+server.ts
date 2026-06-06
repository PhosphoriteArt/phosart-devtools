import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addRemote } from '$lib/server/gitops/git';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const name = body.name;
		const url = body.url;

		if (!name || !url) {
			return json(
				{
					success: false,
					error: 'Both "name" and "url" are required'
				},
				{ status: 400 }
			);
		}

		const result = await addRemote(name, url);
		return json({
			success: true,
			result,
			message: `Remote "${name}" added successfully`
		});
	} catch (error) {
		return json(
			{
				success: false,
				error: (error as Error).message
			},
			{ status: 500 }
		);
	}
};
