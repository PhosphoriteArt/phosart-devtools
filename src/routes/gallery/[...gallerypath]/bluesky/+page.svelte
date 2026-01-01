<script lang="ts">
	import ActionButton from '$lib/ActionButton.svelte';
	import type { PostWithMatch } from '$lib/server/bluesky/types.js';
	import Checkbox from '$lib/form/Checkbox.svelte';
	import OriginalImage from '$lib/form/OriginalImage.svelte';
	import { isBaseGallery } from '$lib/galleryutil';
	import { uploadImage, type GalleryPath } from '$lib/util.js';
	import type { Post } from 'phosart-bsky/util';
	import type { BaseArtPiece } from 'phosart-common/util';
	import { persistGallery } from '../+page.svelte';
	import { DateTime } from 'luxon';
	import { invalidateAll } from '$app/navigation';

	const { data } = $props();

	let showMatched = $state(true);
	let showMatchedElsewhere = $state(false);
	let loading = $state(false);
	const skipset = $derived(data.ss[data.galleryPath] ?? new Set());

	const posts = $derived.by(() => {
		const posts = data.posts
			.map((p) => {
				const ids = p.image_fullsize_ids ?? [];
				function filterIds(_: unknown, i: number) {
					return !skipset.has(ids[i]);
				}
				return {
					...p,
					image_alt: p.image_alt?.filter(filterIds) ?? null,
					image_fullsize_url: p.image_fullsize_url?.filter(filterIds) ?? null,
					image_fullsize_ids: p.image_fullsize_ids?.filter(filterIds) ?? null,
					image_fullsize_phash: p.image_fullsize_phash?.filter(filterIds) ?? null,
					image_fullsize_matches: p.image_fullsize_matches
						.filter(filterIds)
						.map((arr) => arr.filter((path) => path.gallery === data.galleryPath)),
					video_thumb_matches: skipset.has(p.video_thumb_id ?? '')
						? []
						: p.video_thumb_matches.filter((path) => path.gallery === data.galleryPath),
					video_thumb_id: skipset.has(p.video_thumb_id ?? '') ? null : p.video_thumb_id,
					video_thumb_phash: skipset.has(p.video_thumb_id ?? '') ? null : p.video_thumb_phash,
					video_thumb_url: skipset.has(p.video_thumb_id ?? '') ? null : p.video_thumb_url,
					original: p
				};
			})
			.filter((p) => {
				return (p.image_fullsize_ids?.length ?? 0) + (p.video_thumb_id ? 1 : 0) > 0;
			});
		if (showMatched) {
			return posts;
		}
		return posts.filter((post) => {
			let p: PostWithMatch = post;
			if (!showMatchedElsewhere) {
				p = post.original;
			}
			return p.image_fullsize_matches.flatMap((m) => m).length + p.video_thumb_matches.length === 0;
		});
	});

	function setLoading(flag: boolean) {
		loading = flag;
	}

	function makeImport(
		ref: GalleryPath,
		setPiece: (p: BaseArtPiece) => BaseArtPiece
	): () => Promise<void> {
		return async () => {
			if (!isBaseGallery(data.gallery)) {
				return;
			}
			const updatedGallery = {
				pieces: data.gallery.pieces.map((p) => (p.slug === ref.piece ? setPiece(p) : p))
			};
			await persistGallery(data.galleryPath, updatedGallery);
		};
	}

	function makeOverwriteImage(ref: GalleryPath, fsid: string): () => Promise<void> {
		return async () => {
			if (!isBaseGallery(data.gallery)) {
				return;
			}

			const blobUrl = `/api/bluesky/image/${fsid}`;
			const imageRes = await fetch(blobUrl);
			const blob = await imageRes.blob();

			const newImage = await uploadImage(ref, blob, fsid);

			const updatedGallery = {
				pieces: data.gallery.pieces.map((p) =>
					p.slug === ref.piece ? { ...p, image: newImage.filename } : p
				)
			};
			await persistGallery(data.galleryPath, updatedGallery);
		};
	}

	function makeAddAsNew(
		ref: GalleryPath,
		fsid: string,
		alt: string,
		post: Post
	): () => Promise<void> {
		return async () => {
			if (!isBaseGallery(data.gallery)) {
				return;
			}

			const blobUrl = `/api/bluesky/image/${fsid}`;
			const imageRes = await fetch(blobUrl);
			const blob = await imageRes.blob();

			const newImage = await uploadImage(ref, blob, fsid);

			const updatedGallery = {
				pieces: [
					...data.gallery.pieces,
					{
						alt,
						name: post.text.split(' ').slice(0, 5).join(' '),
						characters: tagsFromPost(post)
							.filter((t) => /^oc:/.test(t))
							.map((t) => t.replace(/^oc:/, '')),
						tags: tagsFromPost(post).filter((t) => !/^oc:/.test(t)),
						date: DateTime.fromISO(post.date).toJSDate(),
						image: newImage.filename,
						slug: fsid,
						id: fsid,
						alts: undefined,
						artist: data.config?.defaultArtist ?? undefined,
						description: post.text,
						position: undefined,
						video: undefined
					} satisfies BaseArtPiece
				]
			};
			await persistGallery(data.galleryPath, updatedGallery);
		};
	}

	function makeMarkDone(fsid: string): () => Promise<void> {
		return async () => {
			try {
				await fetch(`/api/bluesky/mark/${data.galleryPath}/${fsid}`, { method: 'PUT' });
			} finally {
				await invalidateAll();
			}
		};
	}

	function tagsFromPost(post: Post): string[] {
		const arr: string[] = [];
		const re = /#([A-Za-z0-9_-]+)/gim;
		let m: RegExpMatchArray | null = null;

		do {
			m = re.exec(post.text);
			if (m?.[1]) {
				arr.push(m[1]);
			}
		} while (m);

		console.log(arr);
		return arr;
	}
</script>

<div class="mt-4 flex items-center gap-x-4">
	<Checkbox label="Show Matched" bind:checked={showMatched} />
	{#if !showMatched}
		<span class="ml-6">
			<Checkbox label="Include Matched Elsewhere" bind:checked={showMatchedElsewhere} />
		</span>
	{/if}
	{#if skipset.size > 0}
		<ActionButton
			action={async () => {
				await fetch(`/api/bluesky/mark?gallerypath=${data.galleryPath}`, { method: 'DELETE' });
				await invalidateAll();
			}}
		>
			Re-show hidden posts
		</ActionButton>
	{/if}
</div>
{#snippet match(
	post: (typeof posts)[number],
	i: number,
	fsid: string,
	matches: GalleryPath[],
	origMatches: GalleryPath[]
)}
	<div class="flex h-full">
		<div class="flex items-center">
			<span style="writing-mode: tb-rl" class=" inline-block rotate-180 text-center">
				Image {i + 1}
			</span>
		</div>
		<div class="m-4 flex w-full items-center rounded-xl border p-4">
			<div class="flex flex-col items-center">
				<img
					src="/api/bluesky/image/{fsid}"
					class="max-h-64 max-w-64"
					alt={post.image_alt?.[i] ?? ''}
				/>
				<div
					class="max-h-16 max-w-64 overflow-scroll border-l-2 border-l-gray-400 pl-2 text-xs text-gray-600 italic"
				>
					<pre class="font-serif whitespace-pre-wrap">{post.image_alt?.[i] ?? ''}</pre>
				</div>
			</div>
			<div class="px-4">
				<i class="fa-solid fa-chevron-right text-2xl"></i>
			</div>
			<div class="flex h-full grow flex-col items-center justify-center">
				<div class="text-xl underline">Matches</div>
				<div class="flex grow flex-col items-center justify-center">
					{#if matches.length === 0}
						<ActionButton
							{setLoading}
							disabled={loading}
							class="p-4 px-4"
							action={makeAddAsNew(
								{ gallery: data.galleryPath, piece: '' },
								fsid,
								post.image_alt?.[i] ?? '',
								post
							)}
						>
							No matches; add as new.
						</ActionButton>
						{#if origMatches.length !== 0}
							<div class="mt-2 text-xs text-gray-500 italic">
								FYI: this image matches in other galleries
							</div>
						{/if}
					{/if}
					{#each matches as match (match)}
						{@const piece = isBaseGallery(data.gallery)
							? data.gallery.pieces.find((p) => p.slug === match.piece)
							: null}
						<div class="my-2 flex items-stretch">
							<OriginalImage class="max-h-64 max-w-64" galleryPath={match}></OriginalImage>
							<div class="mx-2 w-2 border border-l-0"></div>
							<div class="flex flex-col items-stretch justify-center">
								<div class="mb-2 text-center italic underline decoration-gray-400 decoration-1">
									{piece?.name ?? match.piece}
								</div>
								<div class="flex grow flex-col gap-y-2">
									<ActionButton
										{setLoading}
										disabled={loading}
										action={makeImport(match, (p) => ({ ...p, description: post.text }))}
									>
										Import Description from Post
									</ActionButton>
									<ActionButton
										{setLoading}
										disabled={loading}
										action={makeImport(match, (p) => ({
											...p,
											tags: [...new Set([...p.tags, ...tagsFromPost(post)])]
										}))}
									>
										Import Tags from Post
									</ActionButton>
									{#if post.image_alt?.[i]}
										<ActionButton
											{setLoading}
											disabled={loading}
											action={makeImport(match, (p) => ({
												...p,
												alt: post.image_alt?.[i] ?? p.alt
											}))}
										>
											Import Alt Text from Image
										</ActionButton>
									{/if}
									<ActionButton
										{setLoading}
										disabled={loading}
										class="border-red-500 text-red-800"
										action={makeOverwriteImage(match, fsid)}
									>
										Overwrite Image
									</ActionButton>
								</div>
							</div>
						</div>
					{/each}
					{#if matches.length !== 0}
						<div class="relative my-2 flex w-full justify-center">
							<div class="absolute top-1/2 -z-10 w-full border-t border-gray-300"></div>
							<span class="float-start bg-white px-2">or</span>
						</div>
						<ActionButton
							{setLoading}
							disabled={loading}
							action={makeAddAsNew(
								{ gallery: data.galleryPath, piece: '' },
								fsid,
								post.image_alt?.[i] ?? '',
								post
							)}
						>
							Add as New
						</ActionButton>
					{/if}
				</div>
			</div>
		</div>
		<div class="flex items-center">
			<span style="writing-mode: tb-rl" class=" inline-block text-center">
				<ActionButton action={makeMarkDone(fsid)}>Done</ActionButton>
			</span>
		</div>
	</div>
{/snippet}

{#each posts as post (post.uri)}
	<div class="my-4 rounded-2xl border p-3">
		<div class="border-l-2 border-l-gray-400 pl-2 text-gray-600 italic">
			<pre class="font-serif whitespace-pre-wrap">{post.text}</pre>
		</div>
		{#each post.image_fullsize_url ?? [] as url, i (url)}
			{@const fsid = post.image_fullsize_ids![i]!}
			{@const fsmatches = post.image_fullsize_matches![i]!}
			{@const origfsmatches = post.original.image_fullsize_matches![i]!}
			{@render match(post, i, fsid, fsmatches, origfsmatches)}
		{/each}
		{#if post.video_thumb_url && post.video_thumb_id}
			{@render match(
				post,
				0,
				post.video_thumb_id,
				post.video_thumb_matches,
				post.original.video_thumb_matches
			)}
		{/if}
	</div>
{/each}
