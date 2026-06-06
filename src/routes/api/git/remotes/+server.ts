import { json } from '@sveltejs/kit';
import { remotes } from '$lib/server/gitops/git';

export const GET = async () => {
	return json(await remotes());
};
