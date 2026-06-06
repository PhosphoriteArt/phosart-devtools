import { json, type RequestHandler } from '@sveltejs/kit';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readDeploySettings } from '../../config/util';
import { artroot } from '../util';
const execProm = promisify(execFile);

export const POST: RequestHandler = async () => {
	const proj = (await readDeploySettings()).cloudflare_project_name;
	if (!proj) {
		return json({ message: 'No project has been selected' }, { status: 400 });
	}
	try {
		return json({
			out: (
				await execProm(
					'pnpm',
					[
						'dlx',
						'wrangler',
						'pages',
						'deploy',
						'build',
						'--project-name',
						proj,
						'--commit-dirty=true'
					],
					{ cwd: artroot() }
				)
			).stdout
		});
	} catch (e) {
		return json({ message: String(e) }, { status: 500 });
	}
};
