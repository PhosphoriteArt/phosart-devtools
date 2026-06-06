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
		return json(
			JSON.parse(
				(
					await execProm(pnpmPath, ['dlx', 'wrangler', 'pages', 'project', 'list', '--json'], {
						cwd: artroot(),
						shell: process.platform === 'win32'
					})
				).stdout
			)
		);
	} catch (e) {
		return json({ message: String(e) }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	const inp = await request.json();
	if (
		typeof inp !== 'object' ||
		!inp ||
		!('project_name' in inp) ||
		typeof inp.project_name !== 'string'
	) {
		return json({ error: 'project_name required but not provided' }, { status: 400 });
	}
	if (!/^[A-Za-z][A-Za-z0-9_-]+$/.test(inp.project_name) || inp.project_name.length > 32) {
		return json(
			{ error: 'project name is invalid (must contain only letters, numbers, - or _)' },
			{ status: 400 }
		);
	}

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
		return json({
			out: (
				await execProm(
					pnpmPath,
					[
						'dlx',
						'wrangler',
						'pages',
						'project',
						'create',
						inp.project_name,
						'--production-branch',
						'main'
					],
					{ cwd: artroot(), shell: process.platform === 'win32' }
				)
			).stdout
		});
	} catch (e) {
		if (String(e).includes('Subdomain is unavailable')) {
			return json(
				{ message: 'That project is taken; please choose a different name' },
				{ status: 409 }
			);
		}
		return json({ message: String(e) }, { status: 500 });
	}
};
