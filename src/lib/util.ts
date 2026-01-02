import type { BaseArtPiece } from 'phosart-common/util';
import { Logger, type IMeta } from 'tslog';
const logger = createLogger();

export function unique<T>(arr: T[]): T[] {
	return [...new Set(arr)];
}

export type CharacterPath = {
	character: string;
	for: 'full' | 'thumb';
	gallery?: undefined;
	piece?: undefined;
	alt?: undefined;
	altIndex?: undefined;
};
export type GalleryPath = {
	character?: undefined;
	for?: undefined;
	gallery: string;
	piece: string;
	alt?: string;
	altIndex?: number;
};
export type UploadPath = CharacterPath | GalleryPath;

export async function uploadImage(
	path: UploadPath,
	f: Blob,
	name: string
): Promise<{ filename: string; thumbnail?: string /* only for videos */ }> {
	logger.debug('Uploading image from blob', name, 'to', path);
	const formData = new FormData();
	formData.append('file', f);
	formData.append('filename', name);
	formData.append('filetype', f.type);

	let reqpath: string;
	if (path.character !== undefined) {
		reqpath = `/api/characters/upload-image?for=${path.for}`;
	} else {
		reqpath = `/api/gallery/${path.gallery}/upload-image`;
	}

	const res = await fetch(reqpath, {
		method: 'POST',
		body: formData
	});
	const json = await res.json();
	let thumbnail: string | undefined = undefined;
	if (typeof json === 'object' && 'tname' in json && typeof json.tname === 'string') {
		thumbnail = json.tname;
	}

	if (typeof json === 'object' && 'fname' in json && typeof json.fname === 'string') {
		const ret = { filename: json.fname, thumbnail };
		logger.debug('Upload complete:', ret);
		return ret;
	}
	throw new Error(
		`return value from image upload did not contain expected filename: ${JSON.stringify(json)}`
	);
}

export interface BaseResource {
	image: BaseArtPiece['image'];
	video?: BaseArtPiece['video'];
}

export type LogObj = {
	_meta: IMeta;
} & Record<string, unknown>;

export function createLogger(): Logger<LogObj> {
	const l = new Logger<LogObj>({
		minLevel: getLogLevel()
	});

	if (typeof process !== 'undefined') {
		import('./server/log.ts').then((mod) => {
			l.attachTransport(mod.transport);
		});
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
