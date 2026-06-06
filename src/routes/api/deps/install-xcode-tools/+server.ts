import { tryInstallXcodeTools } from '$lib/server/deps/util';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async () => {
	try {
		return json({ output: await tryInstallXcodeTools() });
	} catch (e) {
		return json({ error: String(e) }, { status: 500 });
	}
};
