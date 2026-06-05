<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import SearchInput from '../search/SearchInput.svelte';
	import { hasKey, hasVisualize } from '../search/SearchResults.svelte';
	import { CircleX } from '@lucide/svelte';

	interface Props {
		label: string;
		value: Array<T>;

		prefix?: string;

		onSelect?: (selected: string, option?: T) => void;
		onDeselect?: () => void;
		onRemove?: (option: T, index: number) => void;
		validationError?: string;
		noReportValidation?: true;

		options?: Record<string, T>;
		search: string;

		renderChip?: Snippet<[obj: T]>;
		class?: string;
	}

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
		onRemove,
		noReportValidation,
		class: cls
	}: Props = $props();

	let didEscape = $state(false);

	let searchInput: SearchInput<T> | null = $state(null);

	const dedupedOptions = $derived.by(() => {
		if (!options) return undefined;
		if (didEscape) return undefined;

		const optionsCopy = { ...options };

		for (const [k, val] of Object.entries(options)) {
			if ((value ?? []).includes(val)) {
				delete optionsCopy[k];
			}
		}

		return optionsCopy;
	});
</script>

{#snippet defaultRenderChip(chip: T)}
	<div>{prefix}{hasVisualize(chip) ? chip.asVisualized() : hasKey(chip) ? chip.asKey() : chip}</div>
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex flex-row items-center gap-x-2 {cls}"
	onkeydowncapture={(e) => {
		if (!e.shiftKey && !e.metaKey && !e.altKey && !e.ctrlKey && e.code === 'Escape') {
			console.log('CAPTURED');
			didEscape = true;
			e.preventDefault();
			e.stopImmediatePropagation();
			e.stopPropagation();
		}
	}}
	onkeydown={(e) => {
		if (!e.shiftKey && !e.metaKey && !e.altKey && !e.ctrlKey && e.code !== 'Escape') {
			didEscape = false;
		}
	}}
>
	<div
		class="relative m-2 {cls} flex flex-wrap items-center gap-1 rounded-xl border border-surface-200-800 p-2 focus:border-blue-300"
	>
		<label class="label">
			<span class="label-text">{label}</span>
			<div class="flex flex-wrap items-center gap-1">
				{#each value ?? [] as chip, i (chip)}
					<div
						class="flex w-max items-center rounded-lg preset-outlined-surface-500 px-1 py-0.5 text-xs"
					>
						{#if onRemove}
							<button
								title="remove"
								class="mr-1 cursor-pointer"
								onclick={() => {
									onRemove(chip, i);
								}}
							>
								<CircleX size={16} class="text-surface-800-200" />
							</button>
						{/if}
						{@render (renderChip ?? defaultRenderChip)(chip)}
					</div>
				{/each}
				<div
					class="relative flex items-center rounded-lg border border-dotted border-gray-600 px-1 py-0.5"
					class:border-red-400={!!validationError}
					title="Type and press enter to add"
				>
					<button
						title="Confirm"
						class="cursor-pointer pr-0.5"
						onclick={() => {
							onSelect?.(search, dedupedOptions?.[search]);
						}}
					>
						<i
							class="fa-regular fa-square-plus text-sm {validationError
								? 'text-red-600'
								: !search
									? 'text-gray-300'
									: 'text-green-700'}"
						></i>
					</button>
					<div class="pr-0.5">{prefix}</div>
					<SearchInput
						options={dedupedOptions}
						bind:search
						acceptSuggestionOnEnter
						{validationError}
						{onSelect}
						{onDeselect}
						{noReportValidation}
						class="input"
						onComplete={(completion, by) => {
							if (by === 'click') {
								onSelect?.(completion, dedupedOptions?.[completion]);
							}
						}}
						bind:this={searchInput}
					/>
				</div>
			</div>
		</label>
	</div>
</div>
