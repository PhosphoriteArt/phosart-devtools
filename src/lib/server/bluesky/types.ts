import type { Post, ImageDetails } from 'phosart-bsky/util';
import type { GalleryPath } from '$lib/util';

export interface ExtendedImageDetails extends ImageDetails {
	id: string;
	phash: string;
}

export interface ExtendedPost extends Omit<Post, 'image_details'> {
	image_details: ExtendedImageDetails[];
}

export interface ImageDetailsWithMatch extends ExtendedImageDetails {
	matches: GalleryPath[];
}

export interface PostWithMatch extends Omit<ExtendedPost, 'image_details'> {
	image_details: ImageDetailsWithMatch[];
}
