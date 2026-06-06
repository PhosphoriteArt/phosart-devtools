import { json, type RequestHandler } from '@sveltejs/kit';
import { readDeploySettings, writeDeploySettings } from './util';

export const GET: RequestHandler = async () => {
	return json(await readDeploySettings());
};

export const PUT: RequestHandler = async ({ request }) => {
	await writeDeploySettings(await request.json());
	return json({ ok: true });
};
