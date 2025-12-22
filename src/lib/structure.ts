import type { Artist, Character, Gallery } from 'phosart-common/util';

export type File =
	| { $type: 'gallery'; data: Gallery }
	| { $type: 'character'; data: Character[] }
	| { $type: 'artist'; data: Artist };

export type FileStructure = {
	$type: 'folder';
	structure: {
		[name: string]: FileStructure | File;
	};
};
