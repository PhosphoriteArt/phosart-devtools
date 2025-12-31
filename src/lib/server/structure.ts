import type { FileStructure } from '$lib/structure';
import type { ArtistCache, CharacterCache, RawGalleryCache } from 'phosart-common/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Character } from 'phosart-common/util';
import { isExtendsGallery } from '$lib/galleryutil';

export async function search(
	dir: string,
	galleries: RawGalleryCache,
	characters: CharacterCache,
	artists: ArtistCache,
	relative: string = ''
): Promise<FileStructure> {
	const list = await fs.readdir(dir, { withFileTypes: true });
	const structure: FileStructure = { $type: 'folder', structure: {}, items: 0 };

	for (const element of list) {
		const newPath = relative + element.name;
		if (element.isDirectory()) {
			const f = await search(
				path.join(dir, element.name),
				galleries,
				characters,
				artists,
				newPath + '/'
			);
			structure.structure[element.name] = f;
			structure.items += f.items;
		} else if (element.isFile()) {
			if (newPath in galleries) {
				structure.items += 1;
				const g = galleries[newPath];
				if (isExtendsGallery(g)) {
					structure.structure[element.name] = {
						$type: 'gallery',
						data: g,
						isBase: false
					};
				} else {
					structure.structure[element.name] = {
						$type: 'gallery',
						data: g,
						isBase: true
					};
				}
			} else if (newPath in artists) {
				structure.items += 1;
				structure.structure[element.name] = {
					$type: 'artist',
					data: artists[newPath]
				};
			} else {
				const chars: Character[] = [];

				for (const [fname, char] of Object.entries(characters)) {
					const [base] = fname.split('#');
					if (base == newPath) {
						chars.push(char);
					}
				}

				if (chars.length > 0) {
					structure.items += 1;
					structure.structure[element.name] = {
						$type: 'character',
						data: chars
					};
				}
			}
		}
	}

	return structure;
}
