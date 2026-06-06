import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { tryPull } from '$lib/server/gitops/git';
import { createLogger } from '$lib/log';

const logger = createLogger();

export const POST: RequestHandler = async () => {
	try {
		const ok = await tryPull();
		return json({ ok });
	} catch (error) {
		logger.error('Git pull failed:', String(error));
		return json({ message: String(error) }, { status: 500 });
	}
};
