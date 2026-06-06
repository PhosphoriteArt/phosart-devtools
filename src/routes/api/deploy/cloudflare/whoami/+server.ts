import { json, type RequestHandler } from '@sveltejs/kit';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { artroot } from '../util';
import { ensurePnpm } from '$lib/server/deps/ensure';

const execProm = promisify(execFile);

export const GET: RequestHandler = async () => {
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
		const out = JSON.parse(
			(
				await execProm(pnpmPath, ['dlx', 'wrangler', 'whoami', '--json'], {
					cwd: artroot(),
					shell: process.platform === 'win32'
				})
			).stdout
		);
		return json({ ok: out.loggedIn });
	} catch (err) {
		return json({ message: String(err) }, { status: 500 });
	}
};

export const POST: RequestHandler = async () => {
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
		const out = (
			await execProm(pnpmPath, ['dlx', 'wrangler', 'login', '--no-install-skills', '--browser'], {
				cwd: artroot(),
				shell: process.platform === 'win32'
			})
		).stdout;
		return json({ ok: out.includes('logged in') });
	} catch (err) {
		return json({ message: String(err) }, { status: 500 });
	}
};
