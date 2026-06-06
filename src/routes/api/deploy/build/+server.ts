import { ensurePnpm } from '$lib/server/deps/ensure';
import { $ROOT } from '@phosart/common/server';
import { json, type RequestHandler } from '@sveltejs/kit';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execProm = promisify(execFile);

export const POST: RequestHandler = async () => {
	const rt = $ROOT() + '/..';

	try {
		await ensurePnpm();
	} catch (err) {
		return json(
			{
				error: String(err)
			},
			{ status: 500 }
		);
	}
	try {
		await execProm('pnpm', ['run', 'build'], {
			cwd: rt,
			env: { ...process.env, FORCE_STATIC: 'true' }
		});
	} catch (err) {
		return json({ error: String(err) }, { status: 500 });
	}

	return json({
		ok: true
	});
};
