import type { FileStructure } from '$lib/structure';
import type { ArtistCache, CharacterCache, GalleryCache } from 'phosart-common/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Character } from 'phosart-common/util';

export async function search(
	dir: string,
	galleries: GalleryCache,
	characters: CharacterCache,
	artists: ArtistCache,
	relative: string = ''
): Promise<FileStructure> {
	const list = await fs.readdir(dir, { withFileTypes: true });
	const structure: FileStructure = { $type: 'folder', structure: {} };

	for (const element of list) {
		const newPath = relative + element.name;
		if (element.isDirectory()) {
			structure.structure[element.name] = await search(
				path.join(dir, element.name),
				galleries,
        characters,
        artists,
				newPath + '/'
			);
		} else if (element.isFile()) {
			if (newPath in galleries) {
				structure.structure[element.name] = {
					$type: 'gallery',
					data: galleries[newPath]
				};
      } else if (newPath in artists) {
        structure.structure[element.name] = {
          $type: "artist",
          data: artists[newPath]
        }
      } else {
				const chars: Character[] = [];

				for (const [fname, char] of Object.entries(characters)) {
					const [base] = fname.split('#');
					if (base == newPath) {
						chars.push(char);
					}
				}

				if (chars.length > 0) {
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
