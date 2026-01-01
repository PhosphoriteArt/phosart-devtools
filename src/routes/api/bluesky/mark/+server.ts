import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readSkipSet, writeSkipSet } from '$lib/bluesky/cache';

export const PATCH: RequestHandler = async ({ url, request }) => {
	const body: Record<string, string[]> | string[] = await request.json();
	const gpath = url.searchParams.get('gallerypath');
	if (gpath) {
		const ss = await readSkipSet();
		ss[gpath] = new Set([...(body as string[]), ...(ss[gpath] ?? [])]);
		await writeSkipSet(ss);
		return json({ ok: true });
	}

	await writeSkipSet(Object.fromEntries(Object.entries(body).map(([k, v]) => [k, new Set(v)])));
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ url }) => {
	const gpath = url.searchParams.get('gallerypath');
	if (gpath) {
		const ss = await readSkipSet();
		if (gpath in ss) {
			delete ss[gpath];
		}
		await writeSkipSet(ss);
		return json({ ok: true });
	}

	await writeSkipSet({});
	return json({ ok: true });
};
