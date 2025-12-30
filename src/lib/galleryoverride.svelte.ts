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

	setImage(gpath: string, piece: string, alt: string | undefined, override: string | null) {
		this.#ensure(gpath, piece, alt).image = override ?? undefined;
	}
	setVideoFull(gpath: string, piece: string, alt: string | undefined, override: string | null) {
		this.#ensure(gpath, piece, alt).videoFull = override ?? undefined;
	}
	setVideoThumb(gpath: string, piece: string, alt: string | undefined, override: string | null) {
		this.#ensure(gpath, piece, alt).videoThumb = override ?? undefined;
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
