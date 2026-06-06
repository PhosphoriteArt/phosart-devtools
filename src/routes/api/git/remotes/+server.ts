import { json, type RequestHandler } from '@sveltejs/kit';
import { remotes, setRemote } from '$lib/server/gitops/git';
import { createLogger } from '$lib/log';
const logger = createLogger();

export const GET: RequestHandler = async () => {
	try {
		return json(await remotes());
	} catch (error) {
		return json(
			{
				message: String(error)
			},
			{ status: 500 }
		);
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const url = body?.url;

		if (typeof url !== 'string') {
			return json(
				{
					message: 'url is required'
				},
				{ status: 400 }
			);
		}

		const result = await setRemote(url);
		return json({
			ok: true,
			result
		});
	} catch (error) {
		logger.error('Git remote set failed:', String(error));
		return json(
			{
				message: String(error)
			},
			{ status: 500 }
		);
	}
};
