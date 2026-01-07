import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Git } from '$lib/server/gitops/git';

export const GET: RequestHandler = async () => {
	return json(await new Git().status());
};
