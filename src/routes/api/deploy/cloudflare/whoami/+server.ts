import { json, type RequestHandler } from '@sveltejs/kit';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { artroot } from '../util';

const execProm = promisify(execFile);

export const GET: RequestHandler = async () => {
	try {
		const out = JSON.parse(
			(await execProm('pnpm', ['dlx', 'wrangler', 'whoami', '--json'], { cwd: artroot() })).stdout
		);
		return json({ ok: out.loggedIn });
	} catch (err) {
		return json({ message: String(err) }, { status: 500 });
	}
};

export const POST: RequestHandler = async () => {
	try {
		const out = (
			await execProm('pnpm', ['dlx', 'wrangler', 'login', '--no-install-skills', '--browser'], {
				cwd: artroot()
			})
		).stdout;
		return json({ ok: out.includes('logged in') });
	} catch (err) {
		return json({ message: String(err) }, { status: 500 });
	}
};
