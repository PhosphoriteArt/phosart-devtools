import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import winscript from '../assets/scripts/secret-win.ps1?raw';
import macscript from '../assets/scripts/secret-mac.sh?raw';
import linuxscript from '../assets/scripts/secret-linux.sh?raw';

async function scriptpath(): Promise<string> {
	const platform = os.platform();
	const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'phosart-devtool'));
	const scriptpath = path.resolve(path.join(tmp, `script.${platform === 'win32' ? 'ps1' : 'sh'}`));

	let script = linuxscript;
	if (platform === 'darwin') {
		script = macscript;
	} else if (platform === 'win32') {
		script = winscript;
	}

	try {
		await fs.stat(scriptpath);
		return scriptpath;
	} catch {
		// Must create
	}

	await fs.writeFile(scriptpath, script, { encoding: 'utf-8' });
	await fs.chmod(scriptpath, 0o755);

	return scriptpath;
}

type Status = 'OK' | 'MISSING' | 'NOT_SUPPORTED' | 'ERROR';

type Result =
	| { status: 'OK'; value: string | null }
	| { status: 'MISSING'; value: null }
	| { status: 'NOT_SUPPORTED'; value: null }
	| { status: 'ERROR'; value: string };

function b64FromBytes(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString('base64');
}
function bytesFromB64(b64: string): Uint8Array {
	return Buffer.from(b64, 'base64');
}

function runHelper(helperPath: string, input: string, shell = false): Promise<Result> {
	return new Promise((resolve) => {
		const child = spawn(helperPath, [], {
			stdio: 'pipe',
			shell,
			windowsHide: true
		});

		let out = '';
		let err = '';

		child.stdout.setEncoding('utf8');
		child.stderr.setEncoding('utf8');

		child.stdout.on('data', (d) => (out += d));
		child.stderr.on('data', (d) => (err += d));

		child.on('close', () => {
			const lines = out
				.replace(/\r/g, '')
				.split('\n')
				.filter((l) => l.length > 0);
			const status = (lines[0] ?? 'ERROR') as Status;
			const payload = lines[1] ?? 'null';

			if (status === 'OK')
				return resolve({ status: 'OK', value: payload === 'null' ? null : payload });
			if (status === 'MISSING') return resolve({ status: 'MISSING', value: null });
			if (status === 'NOT_SUPPORTED') return resolve({ status: 'NOT_SUPPORTED', value: null });
			return resolve({
				status: 'ERROR',
				value: payload !== 'null' ? payload : err.trim() || 'unknown error'
			});
		});

		child.stdin.end(input);
	});
}

class SecretStore {
	#ephemeral: Map<string, string> = new Map<string, string>();

	private async helperCall(cmd: 'READ' | 'WRITE' | 'DELETE', handle: string, valueB64?: string) {
		const path = await scriptpath();
		const p = os.platform();
		if (p === 'win32') {
			const ps = 'powershell.exe';
			const args = `-NoProfile -ExecutionPolicy Bypass -File "${path}"`;
			return runHelper(
				`${ps} ${args}`,
				[cmd, handle, ...(cmd === 'WRITE' ? [valueB64 ?? ''] : [])].join('\n') + '\n',
				true
			);
		}
		if (p === 'darwin') {
			return runHelper(
				path,
				[cmd, handle, ...(cmd === 'WRITE' ? [valueB64 ?? ''] : [])].join('\n') + '\n'
			);
		}

		return runHelper(
			path,
			[cmd, handle, ...(cmd === 'WRITE' ? [valueB64 ?? ''] : [])].join('\n') + '\n'
		);
	}

	async read(handle: string): Promise<Uint8Array | null> {
		const res = await this.helperCall('READ', handle);
		if (res.status === 'OK') return res.value ? bytesFromB64(res.value) : new Uint8Array();
		if (res.status === 'MISSING') return null;
		if (res.status === 'NOT_SUPPORTED') {
			const v = this.#ephemeral.get(handle);
			return v ? bytesFromB64(v) : null;
		}
		throw new Error(`secret read failed: ${res.value}`);
	}

	async write(handle: string, value: Uint8Array): Promise<Uint8Array | null> {
		const valueB64 = b64FromBytes(value);

		const res = await this.helperCall('WRITE', handle, valueB64);
		if (res.status === 'OK') {
			this.#ephemeral.set(handle, valueB64);
			return res.value ? bytesFromB64(res.value) : null;
		}
		if (res.status === 'NOT_SUPPORTED') {
			const old = this.#ephemeral.get(handle) ?? null;
			this.#ephemeral.set(handle, valueB64);
			return old ? bytesFromB64(old) : null;
		}
		throw new Error(`secret write failed: ${res.status === 'ERROR' ? res.value : 'unknown'}`);
	}

	async delete(handle: string): Promise<Uint8Array | null> {
		const res = await this.helperCall('DELETE', handle);
		if (res.status === 'OK') {
			this.#ephemeral.delete(handle);
			return res.value ? bytesFromB64(res.value) : null;
		}
		if (res.status === 'MISSING') {
			this.#ephemeral.delete(handle);
			return null;
		}
		if (res.status === 'NOT_SUPPORTED') {
			const old = this.#ephemeral.get(handle) ?? null;
			this.#ephemeral.delete(handle);
			return old ? bytesFromB64(old) : null;
		}
		throw new Error(`secret delete failed: ${res.value}`);
	}
}

export const secrets = new SecretStore();
