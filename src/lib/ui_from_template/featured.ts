import { filter } from '@phosart/common/server';
import { type ArtPiece, deduplicateBy } from '@phosart/common/util';

export function getFeaturedPieces(
	all: ArtPiece[],
	featuredTags: string[]
): { featured: ArtPiece[]; nonfeatured: ArtPiece[] } {
	let featured: ArtPiece[] = [];
	let nonfeatured: ArtPiece[] = all;

	for (const tag of featuredTags) {
		featured = featured.concat(filter(all, { type: 'tag', resource: tag }, { sorted: true }));
		nonfeatured = filter(
			nonfeatured,
			{ type: 'tag', resource: tag },
			{ negated: true, sorted: true }
		);
	}

	featured = deduplicateBy(featured, (p) => p.slug);

	return { featured, nonfeatured };
}
