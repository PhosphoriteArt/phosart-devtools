import { createLogger } from '$lib/log';
import { reload } from './fileutil';

const logger = createLogger();

interface ImageProcessWatcher {
	queue: symbol[];
	ready?: (s: symbol) => void;
	stop: boolean;
	worker: Promise<void>;
	state: 'working' | 'waiting';
}

async function worker(ipw: ImageProcessWatcher, initialWait: Promise<symbol>): Promise<void> {
	await initialWait;
	while (!ipw.stop) {
		while (ipw.queue.length === 0) {
			ipw.state = 'waiting';
			await new Promise<symbol>((resolve) => {
				ipw.ready = resolve;
			});
		}
		ipw.state = 'working';

		ipw.queue.splice(0, ipw.queue.length);

		logger.info('Found work to do, regenerating images...');
		// Go generate images/etc
		await reload();
		logger.info('Done regenerating images');
	}
}

function getWatcher(): ImageProcessWatcher {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let ipw: ImageProcessWatcher | undefined | null = (global as any)._ipw;
	if (!ipw) {
		let resolve: ((s: symbol) => void) | undefined = undefined;
		const prom = new Promise<symbol>((res) => {
			resolve = res;
		});

		ipw = {
			queue: [],
			stop: false,
			ready: resolve,
			worker: null as never,
			state: 'waiting'
		};
		ipw.worker = worker(ipw, prom);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(global as any)._ipw = ipw;
	}

	return ipw;
}

export function isWorking(): boolean {
	return getWatcher().state === 'working';
}

export function signalWork() {
	const w = getWatcher();
	const s = Symbol();
	w.queue.push(s);
	w.ready?.(s);
}

export async function drain() {
	const w = getWatcher();
	w.stop = true;
	signalWork();

	await w.worker;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(global as any)._ipw = null;
}
