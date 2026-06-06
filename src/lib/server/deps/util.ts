import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execProm = promisify(execFile);

export async function ensure(command: string): Promise<string> {
	let findCmd = 'which';
	if (process.platform === 'win32') {
		findCmd = 'where.exe';
	}

	const out = await execProm(findCmd, [command]);
	const path = out.stdout.split('\n')[0];
	if (!path) {
		throw new Error(`Invalid path ${path} returned`);
	}
	return path.trim();
}

export async function tryInstallXcodeTools(): Promise<string> {
	const out = await execProm('xcode-select', ['--install']);
	return out.stdout;
}
