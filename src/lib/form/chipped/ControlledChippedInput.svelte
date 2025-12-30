<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import SearchInput from '../search/SearchInput.svelte';

	interface Props {
		label: string;
		value: Array<T>;

		prefix?: string;

		onSelect?: (selected: string, option?: T) => void;
		onDeselect?: () => void;
		onRemove?: (option: T, index: number) => void;
		validationError?: string;

		options?: Record<string, T>;
		search: string;

		renderChip?: Snippet<[obj: T]>;
	}

	const id = $props.id();

	let {
		label,
		value,
		options,
		search = $bindable(),
		prefix,
		renderChip,
		onDeselect,
		onSelect,
		validationError,
		onRemove
	}: Props = $props();

	const dedupedOptions = $derived.by(() => {
		if (!options) return undefined;

		const optionsCopy = { ...options };

		for (const [k, val] of Object.entries(options)) {
			if (value.includes($state.snapshot(val) as T)) {
				delete optionsCopy[k];
			}
		}

		return optionsCopy;
	});
</script>

{#snippet defaultRenderChip(chip: T)}
	<div>{prefix}{chip}</div>
{/snippet}

<div class="flex flex-row items-center gap-x-2">
	<label for="form-{id}"><pre>{label}</pre></label>
	<div
		class="relative m-2 flex flex-wrap items-center gap-1 rounded-xl border bg-white p-2 focus:border-blue-300"
	>
		{#each value as chip, i (chip)}
			<div class="flex w-max items-center rounded-lg border px-1 py-0.5">
				{#if onRemove}
					<button
						title="remove"
						class="cursor-pointer"
						onclick={() => {
							onRemove(chip, i);
						}}><i class="fa-regular fa-circle-xmark text-sm text-gray-400"></i></button
					>
				{/if}
				{@render (renderChip ?? defaultRenderChip)(chip)}
			</div>
		{/each}
		<div
			class="relative flex rounded-lg border border-dotted border-gray-600 px-1 py-0.5"
			class:border-red-400={!!validationError}
		>
			<div class="pr-0.5">{prefix}</div>
			<SearchInput options={dedupedOptions} bind:search {validationError} {onSelect} {onDeselect} />
		</div>
	</div>
</div>
