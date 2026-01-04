<script lang="ts" module>
	function applySkipsetAndGallery(skipset: Set<string>, galleryPath: string, post: PostWithMatch) {
		const image_details = post.image_details.filter((v) => !skipset.has(v.id));
		return {
			...post,
			image_details: image_details.map((v) => ({
				...v,
				matches: v.matches.filter((match) => match.gallery === galleryPath)
			})),
			original: { ...post, image_details }
		};
	}
	function makeSkipsetAndGalleryApplicator(
		skipset: Set<string>,
		galleryPath: string
	): (p: PostWithMatch) => FilteredPost {
		return (p) => applySkipsetAndGallery(skipset, galleryPath, p);
	}
	type FilteredPost = ReturnType<typeof applySkipsetAndGallery>;

	function postHasContent(p: FilteredPost): boolean {
		return p.image_details.length > 0;
	}

	function postHasMatches(p: PostWithMatch): boolean {
		return p.image_details.flatMap((m) => m.matches).length > 0;
	}
</script>

<script lang="ts">
	import ActionButton from '$lib/ActionButton.svelte';
	import type { PostWithMatch } from '$lib/server/bluesky/types.js';
	import Checkbox from '$lib/form/Checkbox.svelte';
	import OriginalImage from '$lib/form/OriginalImage.svelte';
	import { isBaseGallery } from '$lib/galleryutil';
	import { uploadImage, type GalleryPath } from '$lib/util.js';
	import type { Post } from '@phosart/bsky/util';
	import type { BaseArtPiece, BaseGallery, RawGallery } from '@phosart/common/util';
	import { persistGallery } from '../+page.svelte';
	import { DateTime } from 'luxon';
	import { invalidateAll } from '$app/navigation';
	import ScreenSentinel from '$lib/ScreenSentinel.svelte';
	import type { SkipSet } from '$lib/server/bluesky/cache';
	import type { BuiltinSettings, SettingsFor } from '@phosart/common/server';
	import { getEpoch } from '$lib/epoch.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte';

	interface Props {
		galleryPath: string;
		ss: SkipSet;
		posts: PostWithMatch[];
		gallery: RawGallery;
		config: SettingsFor<BuiltinSettings>;
	}

	const { galleryPath, ss, posts: rawPosts, gallery, config }: Props = $props();

	let showMatched = $state(true);
	let showMatchedElsewhere = $state(false);
	let loading = $state(false);
	let limit = $state(4);
	const skipset = $derived(ss[galleryPath] ?? new Set());

	const epoch = getEpoch();
	const overrides = getOverrides();

	function extendLimit() {
		limit += 2;
	}

	const posts = $derived.by(() => {
		const posts = rawPosts
			.map(makeSkipsetAndGalleryApplicator(skipset, galleryPath))
			.filter(postHasContent);

		if (showMatched) {
			return posts;
		}

		// Else, skip those with any matches
		return posts.filter((post) => {
			let p: PostWithMatch = post;
			if (!showMatchedElsewhere) {
				p = post.original;
			}
			return !postHasMatches(p);
		});
	});

	function setLoading(flag: boolean) {
		loading = flag;
	}

	async function save(updatedGallery: BaseGallery) {
		loading = true;
		try {
			await persistGallery(galleryPath, updatedGallery, /* invalidate = */ false);
			epoch.epoch += 1;
			overrides.reset();
			await invalidateAll();
		} finally {
			loading = false;
		}
	}

	function makeImport(
		ref: GalleryPath,
		setPiece: (p: BaseArtPiece) => BaseArtPiece
	): () => Promise<void> {
		return async () => {
			if (!isBaseGallery(gallery)) {
				return;
			}
			const updatedGallery = {
				pieces: gallery.pieces.map((p) => (p.slug === ref.piece ? setPiece(p) : p))
			};
			await save(updatedGallery);
		};
	}

	function makeOverwriteImage(ref: GalleryPath, fsid: string): () => Promise<void> {
		return async () => {
			if (!isBaseGallery(gallery)) {
				return;
			}

			const blobUrl = `/api/bluesky/image/${fsid}`;
			const imageRes = await fetch(blobUrl);
			const blob = await imageRes.blob();

			const newImage = await uploadImage(ref, blob, fsid);

			const updatedGallery = {
				pieces: gallery.pieces.map((p) =>
					p.slug === ref.piece ? { ...p, image: newImage.filename } : p
				)
			};
			await save(updatedGallery);
		};
	}

	async function newPieceFromPost(fsid: string, alt: string, post: Post): Promise<BaseArtPiece> {
		const blobUrl = `/api/bluesky/image/${fsid}`;
		const imageRes = await fetch(blobUrl);
		const blob = await imageRes.blob();

		const newImage = await uploadImage({ gallery: galleryPath, piece: fsid }, blob, fsid);

		return {
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
			artist: config?.defaultArtist ?? undefined,
			description: post.text,
			position: undefined,
			video: undefined
		};
	}

	function makeAddAsNew(fsid: string, alt: string, post: Post): () => Promise<void> {
		return async () => {
			if (!isBaseGallery(gallery)) {
				return;
			}

			const updatedGallery = {
				pieces: [...gallery.pieces, await newPieceFromPost(fsid, alt, post)]
			};
			await save(updatedGallery);
		};
	}

	function makeMarkDone(fsid: string): () => Promise<void> {
		return async () => {
			try {
				await fetch(`/api/bluesky/mark/${galleryPath}/${fsid}`, { method: 'PUT' });
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
		<ActionButton
			{setLoading}
			disabled={loading}
			action={async () => {
				if (!isBaseGallery(gallery)) {
					return;
				}

				const pieces = await Promise.all(
					posts.flatMap((post) => {
						return post.image_details.map(async (deets) => {
							return await newPieceFromPost(deets.id, deets.alt_text, post);
						});
					})
				);
				const updatedGallery = {
					pieces: [...gallery.pieces, ...pieces]
				};
				await save(updatedGallery);
			}}
		>
			Add All
		</ActionButton>
	{/if}
	{#if skipset.size > 0}
		<ActionButton
			action={async () => {
				await fetch(`/api/bluesky/mark?gallerypath=${galleryPath}`, { method: 'DELETE' });
				await invalidateAll();
			}}
		>
			Re-show hidden posts
		</ActionButton>
	{/if}
</div>
{#snippet match(post: FilteredPost, i: number)}
	{@const details = post.image_details[i]!}
	{@const original = post.original.image_details[i]!}
	<div class="flex h-full">
		<div class="flex items-center">
			<span style="writing-mode: tb-rl" class=" inline-block rotate-180 text-center">
				Image {i + 1}
			</span>
		</div>
		<div class="m-4 flex w-full items-center rounded-xl border p-4">
			<div class="flex flex-col items-center">
				<img
					src="/api/bluesky/image/{details.id}"
					class="max-h-64 max-w-64"
					alt={details.alt_text}
				/>
				<div
					class="no-scrollbar max-h-16 max-w-64 overflow-scroll border-l-2 border-l-gray-400 pl-2 text-xs text-gray-600 italic"
				>
					<pre class="font-serif whitespace-pre-wrap">{details.alt_text}</pre>
				</div>
			</div>
			<div class="px-4">
				<i class="fa-solid fa-chevron-right text-2xl"></i>
			</div>
			<div class="flex h-full grow flex-col items-center justify-center">
				<div class="text-xl underline">Matches</div>
				<div class="flex grow flex-col items-center justify-center">
					{#if details.matches.length === 0}
						<ActionButton
							{setLoading}
							disabled={loading}
							class="p-4 px-4"
							action={makeAddAsNew(details.id, details.alt_text, post)}
						>
							No matches; add as new.
						</ActionButton>
						{#if original.matches.length !== 0}
							<div class="mt-2 text-xs text-gray-500 italic">
								FYI: this image matches in other galleries
							</div>
						{/if}
					{/if}
					{#each details.matches as match (match)}
						{@const piece = isBaseGallery(gallery)
							? gallery.pieces.find((p) => p.slug === match.piece)
							: null}
						<div class="my-2 flex items-stretch">
							<div class="flex flex-col items-stretch">
								<OriginalImage class="max-h-64 max-w-64" galleryPath={match}></OriginalImage>
								<div
									class="no-scrollbar max-h-16 max-w-64 overflow-scroll border-l-2 border-l-gray-400 pl-2 text-xs text-gray-600 italic"
								>
									<pre class="font-serif whitespace-pre-wrap">{piece?.alt || '(no alt text)'}</pre>
								</div>
							</div>
							<div class="mx-2 w-2 border border-l-0"></div>
							<div class="flex flex-col items-stretch justify-center">
								<div class=" text-center italic underline decoration-gray-400 decoration-1">
									{piece?.name ?? match.piece}
								</div>
								<div
									class="no-scrollbar max-h-16 max-w-64 overflow-scroll border-l-2 border-l-gray-400 pl-2 text-xs text-gray-600 italic"
								>
									<pre class="font-serif whitespace-pre-wrap">{piece?.description ||
											'(no description)'}</pre>
								</div>
								<div
									class="mb-2 no-scrollbar max-h-16 max-w-64 overflow-scroll border-l-2 border-l-green-800 pl-2 text-xs text-green-800 italic"
								>
									<pre class="font-serif whitespace-pre-wrap">{piece?.tags
											.map((t) => `#${t}`)
											.join(', ') || '(no tags)'}</pre>
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
									{#if details.alt_text}
										<ActionButton
											{setLoading}
											disabled={loading}
											action={makeImport(match, (p) => ({
												...p,
												alt: details.alt_text
											}))}
										>
											Import Alt Text from Image
										</ActionButton>
									{/if}
									<ActionButton
										{setLoading}
										disabled={loading}
										class="border-red-500 text-red-800"
										action={makeOverwriteImage(match, details.id)}
									>
										Overwrite Image
									</ActionButton>
								</div>
							</div>
						</div>
					{/each}
					{#if details.matches.length !== 0}
						<div class="relative my-2 flex w-full justify-center">
							<div class="absolute top-1/2 -z-10 w-full border-t border-gray-300"></div>
							<span class="float-start bg-white px-2">or</span>
						</div>
						<ActionButton
							{setLoading}
							disabled={loading}
							action={makeAddAsNew(details.id, details.alt_text, post)}
						>
							Add as New
						</ActionButton>
					{/if}
				</div>
			</div>
		</div>
		<div class="flex items-stretch">
			<span style="writing-mode: tb-rl" class="inline-block px-8 text-center">
				<ActionButton class="h-full" action={makeMarkDone(details.id)}>Hide</ActionButton>
			</span>
		</div>
	</div>
{/snippet}

{#each posts.slice(0, limit) as post (post.uri)}
	<div class="my-4 rounded-2xl border p-3">
		<div class="border-l-2 border-l-gray-400 pl-2 text-gray-600 italic">
			<pre class="font-serif whitespace-pre-wrap">{post.text}</pre>
		</div>
		{#each post.image_details as url, i (url)}
			{@render match(post, i)}
		{/each}
	</div>
{/each}

<ScreenSentinel tickMs={150} onObservable={extendLimit} />

{#if limit < posts.length}
	<div class="h-screen"></div>
{/if}
