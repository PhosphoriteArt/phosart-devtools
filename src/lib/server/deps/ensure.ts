import { ensure } from './util';

export async function ensureNode(): Promise<string> {
	return process.execPath;
}

export async function ensurePnpm(): Promise<string> {
	let executable = 'pnpm';
	if (process.platform === 'win32') {
		executable = 'pnpm.cmd';
	}

	try {
		return await ensure(executable);
	} catch (e) {
		throw new Error(
			`Failed to find pnpm. Please make sure it's installed on your computer. Error: ${e}`
		);
	}
}

export async function ensureGit(): Promise<string> {
	let executable = 'git';
	if (process.platform === 'win32') {
		executable = 'git.exe';
	}
	try {
		return await ensure(executable);
	} catch (e) {
		throw new Error(
			`Failed to find git. Please make sure it's installed on your computer. Error: ${e}`
		);
	}
}
