import type { Artist, BaseGallery, ExtendedGallery } from 'phosart-common/util';

export type File =
	| { $type: 'gallery'; isBase: true; data: BaseGallery }
	| { $type: 'gallery'; isBase: false; data: ExtendedGallery }
	| { $type: 'artist'; data: Artist };

export type FileStructure = {
	$type: 'folder';
	items: number;
	structure: {
		[name: string]: FileStructure | File;
	};
};
