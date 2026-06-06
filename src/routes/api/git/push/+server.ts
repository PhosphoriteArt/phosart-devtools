import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { push } from '$lib/server/gitops/git';
import { createLogger } from '$lib/log';

const logger = createLogger();

export const POST: RequestHandler = async () => {
	try {
		const result = await push();
		return json({
			success: true,
			result,
			message: 'Git push completed successfully'
		});
	} catch (error) {
		logger.error('Git push failed:', String(error));
		return json({ success: false, error: (error as Error).message }, { status: 500 });
	}
};
