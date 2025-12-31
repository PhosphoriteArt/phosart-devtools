import { createContext } from 'svelte';
import type { UploadPath } from './util';

type Override = { image?: string; videoFull?: string; videoThumb?: string };
type PieceOverride = { main: Override; alts: Record<string | number, Override> };
type GalleryOverrideStore = Record<string, Record<string, PieceOverride>>;

export class GalleryOverrides {
	#overrides: { overrides: GalleryOverrideStore } = $state({ overrides: {} });

	reset() {
		this.#overrides.overrides = {};
	}

	get(path: UploadPath, piece: string, alt?: string, altIndex?: number): Override | null {
		const gpath = JSON.stringify(path);

		if (alt) {
			return (
				this.#overrides.overrides[gpath]?.[piece]?.alts[alt] ??
				(altIndex !== undefined
					? this.#overrides.overrides[gpath]?.[piece]?.alts[altIndex]
					: null) ??
				null
			);
		}
		return this.#overrides.overrides[gpath]?.[piece]?.main ?? null;
	}

	setFromNew(
		path: UploadPath,
		piece: string,
		alt: string | undefined,
		altIndex: number | undefined,
		f: File
	): void {
		const durl = URL.createObjectURL(f);
		if (f.type.startsWith('video')) {
			this.setVideoFull(path, piece, alt, altIndex, durl);
			this.setVideoThumb(path, piece, alt, altIndex, durl);
		} else {
			this.setImage(path, piece, alt, altIndex, durl);
		}
	}

	setImage(
		path: UploadPath,
		piece: string,
		alt: string | undefined,
		altIndex: number | undefined,
		override: string | null
	) {
		this.#set(path, piece, alt, altIndex, 'image', override);
	}
	setVideoFull(
		path: UploadPath,
		piece: string,
		alt: string | undefined,
		altIndex: number | undefined,
		override: string | null
	) {
		this.#set(path, piece, alt, altIndex, 'videoFull', override);
	}
	setVideoThumb(
		path: UploadPath,
		piece: string,
		alt: string | undefined,
		altIndex: number | undefined,
		override: string | null
	) {
		this.#set(path, piece, alt, altIndex, 'videoThumb', override);
	}

	#set(
		path: UploadPath,
		piece: string,
		alt: string | undefined,
		altIndex: number | undefined,
		key: keyof Override,
		override: string | null
	) {
		const gpath = JSON.stringify(path);
		const obj = this.#ensure(gpath, piece, alt);
		if (obj[key]) {
			URL.revokeObjectURL(obj[key]);
		}
		const indexObj = this.#ensure(gpath, piece, altIndex);
		if (indexObj[key]) {
			URL.revokeObjectURL(indexObj[key]);
		}

		obj[key] = override ?? undefined;
		indexObj[key] = override ?? undefined;
	}

	#ensure(gpath: string, piece: string, alt: string | number | undefined): Override {
		if (!this.#overrides.overrides[gpath]) {
			this.#overrides.overrides[gpath] = {};
		}
		if (!this.#overrides.overrides[gpath][piece]) {
			this.#overrides.overrides[gpath][piece] = { main: {}, alts: {} };
		}
		if (alt && !this.#overrides.overrides[gpath][piece].alts[alt]) {
			this.#overrides.overrides[gpath][piece].alts[alt] = {};
		}
		if (alt) {
			return this.#overrides.overrides[gpath][piece].alts[alt];
		}
		return this.#overrides.overrides[gpath][piece].main;
	}
}

const [get, set] = createContext<GalleryOverrides>();

export function createSharedGalleryOverrides() {
	set(new GalleryOverrides());
}

export function getOverrides(): GalleryOverrides {
	return get();
}
