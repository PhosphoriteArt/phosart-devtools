import { createContext } from 'svelte';

type Override = { image?: string; videoFull?: string; videoThumb?: string };
type PieceOverride = { main: Override; alts: Record<string, Override> };
type GalleryOverrideStore = Record<string, Record<string, PieceOverride>>;

export class GalleryOverrides {
	#overrides: { overrides: GalleryOverrideStore } = $state({ overrides: {} });

	reset() {
		this.#overrides.overrides = {};
	}

	get(gpath: string, piece: string, alt?: string): Override | null {
		if (alt) {
			return this.#overrides.overrides[gpath]?.[piece]?.alts[alt] ?? null;
		}
		return this.#overrides.overrides[gpath]?.[piece]?.main ?? null;
	}

	setFromNew(gpath: string, piece: string, alt: string | undefined, f: File): void {
		const durl = URL.createObjectURL(f);
		if (f.type.startsWith('video')) {
			this.setVideoFull(gpath, piece, alt, durl);
			this.setVideoThumb(gpath, piece, alt, durl);
		} else {
			this.setImage(gpath, piece, alt, durl);
		}
	}

	setImage(gpath: string, piece: string, alt: string | undefined, override: string | null) {
		this.#set(gpath, piece, alt, 'image', override);
	}
	setVideoFull(gpath: string, piece: string, alt: string | undefined, override: string | null) {
		this.#set(gpath, piece, alt, 'videoFull', override);
	}
	setVideoThumb(gpath: string, piece: string, alt: string | undefined, override: string | null) {
		this.#set(gpath, piece, alt, 'videoThumb', override);
	}

	#set(
		gpath: string,
		piece: string,
		alt: string | undefined,
		key: keyof Override,
		override: string | null
	) {
		const obj = this.#ensure(gpath, piece, alt);
		if (obj[key]) {
			URL.revokeObjectURL(obj[key]);
		}

		obj[key] = override ?? undefined;
	}

	#ensure(gpath: string, piece: string, alt: string | undefined): Override {
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
