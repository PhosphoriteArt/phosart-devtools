import type { FileStructure } from '$lib/structure';
import type { ArtistCache, RawGalleryCache } from 'phosart-common/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { isExtendsGallery } from '$lib/galleryutil';
import { createLogger } from '$lib/util';
const logger = createLogger();

export async function search(
	dir: string,
	galleries: RawGalleryCache,
	artists: ArtistCache,
	relative: string = ''
): Promise<FileStructure> {
	logger.silly('Reading file structure rooted at', dir);
	const list = await fs.readdir(dir, { withFileTypes: true });
	const structure: FileStructure = { $type: 'folder', structure: {}, items: 0 };

	for (const element of list) {
		const newPath = relative + element.name;
		if (element.isDirectory()) {
			const f = await search(path.join(dir, element.name), galleries, artists, newPath + '/');
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
			}
		}
	}

	return structure;
}
