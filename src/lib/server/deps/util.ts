import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execProm = promisify(execFile);

export async function ensure(command: string): Promise<string> {
	let findCmd = 'which';
	if (process.platform === 'win32') {
		findCmd = 'where';
		command += '.exe';
	}

	const out = await execProm(findCmd, [command]);
	const path = out.stdout.split('\n')[0];
	if (!path || path[0] !== '/') {
		throw new Error(`Invalid path ${path} returned`);
	}
	return path;
}

export async function tryInstallXcodeTools(): Promise<string> {
	const out = await execProm('xcode-select', ['--install']);
	return out.stdout;
}
