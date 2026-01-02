import { Logger, type IMeta } from 'tslog';

class RingBuffer<T> {
	#buffer: T[];
	#head: number;
	#size: number;
	#capacity: number;
	constructor(capacity: number) {
		this.#buffer = [];
		this.#head = 0;
		this.#size = 0;
		this.#capacity = capacity;
	}

	get length(): number {
		return this.#size;
	}

	get #tail(): number {
		return (this.#head - this.#size + this.#capacity) % this.#capacity;
	}

	push(v: T) {
		this.#size = Math.min(this.#size + 1, this.#capacity);

		this.#buffer[this.#head] = v;
		this.#head = (this.#head + 1) % this.#capacity;
	}

	pop(): T | null {
		if (this.length === 0) {
			return null;
		}

		this.#head = (this.#head - 1 + this.#capacity) % this.#capacity;
		this.#size--;
		return this.#buffer[this.#head];
	}

	get(i: number): T {
		if (i >= this.length || i < -this.length) {
			throw new Error(`Index out of bounds: ${i} < ${-this.length} or ${i} >= ${this.length}`);
		}

		if (i < 0) {
			return this.#buffer[(this.#head + i + this.#capacity) % this.#capacity];
		}

		return this.#buffer[(this.#tail + i) % this.#capacity];
	}

	get unwrapped(): T[] {
		const arr: T[] = [];
		for (let i = 0; i < this.length; i++) {
			arr.push(this.get(i));
		}
		return arr;
	}
}

const buf = new RingBuffer<LogObj>(100);

export function transport(log: LogObj) {
	buf.push(log);
}

export function getRecentLogs(): LogObj[] {
	return buf.unwrapped;
}

export type LogObj = {
	_meta: IMeta;
} & Record<string, unknown>;

export function createLogger(): Logger<LogObj> {
	const l = new Logger<LogObj>({
		minLevel: getLogLevel()
	});

	if (typeof process !== 'undefined') {
		l.attachTransport(transport);
	} else {
		l.settings.stylePrettyLogs = false;
		l.settings.overwrite = {
			transportFormatted(_, logArgs, __, logMeta) {
				console.log(...logArgs, { _meta: logMeta });
			}
		};
	}

	return l;
}
export function getLogLevel(defaultLevel: number = 1): number {
	if (typeof process === 'undefined') {
		return defaultLevel;
	}
	// In Node.JS
	if (!process.env.LOG_LEVEL) {
		return defaultLevel;
	}
	try {
		return parseInt(process.env.LOG_LEVEL);
	} catch {
		return defaultLevel;
	}
}
