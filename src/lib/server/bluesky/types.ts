import type { Post } from 'phosart-bsky/util';
import type { GalleryPath } from '$lib/util';

export interface ExtendedPost extends Post {
	image_fullsize_ids: string[] | null;
	image_fullsize_phash: string[] | null;
	video_thumb_id: string | null;
	video_thumb_phash: string | null;
}

export interface PostWithMatch extends ExtendedPost {
	image_fullsize_matches: GalleryPath[][];
	video_thumb_matches: GalleryPath[];
}
