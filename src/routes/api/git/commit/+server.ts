import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { commit } from '$lib/server/gitops/git';
import { createLogger } from '$lib/log';

const logger = createLogger();

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const message = body.message || 'Auto-commit by @phosart/devtool';

		const result = await commit(message);
		return json({
			ok: true,
			result
		});
	} catch (error) {
		logger.error('Git commit failed:', String(error));
		return json({ message: String(error) }, { status: 500 });
	}
};
