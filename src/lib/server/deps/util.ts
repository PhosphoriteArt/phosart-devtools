import { execFile } from 'node:child_process';

export async function ensure(command: string): Promise<string> {
	let findCmd = 'which';
	if (process.platform === 'win32') {
		findCmd = 'where';
		command += '.exe';
	}

	return await new Promise((resolve, reject) => {
		execFile(findCmd, [command], (err, stdout) => {
			if (err) {
				return reject(err);
			}
			const path = stdout.toString().split('\n')[0];
			if (!path || path[0] !== '/') {
				return reject(new Error(`Invalid path ${path} returned`));
			}
			resolve(path);
		});
	});
}
