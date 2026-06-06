import { ensurePnpm } from '$lib/server/deps/ensure';
import { $ROOT } from '@phosart/common/server';
import { json, type RequestHandler } from '@sveltejs/kit';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execProm = promisify(execFile);

export const POST: RequestHandler = async () => {
	const rt = $ROOT() + '/..';

	let pnpmPath: string;
	try {
		pnpmPath = await ensurePnpm();
	} catch (err) {
		return json(
			{
				message: String(err)
			},
			{ status: 500 }
		);
	}
	try {
		await execProm(pnpmPath, ['run', 'build'], {
			cwd: rt,
			env: { ...process.env, FORCE_STATIC: 'true' },
			shell: process.platform === 'win32'
		});
	} catch (err) {
		return json({ message: String(err) }, { status: 500 });
	}

	return json({
		ok: true
	});
};
