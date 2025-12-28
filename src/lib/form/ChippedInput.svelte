<script lang="ts" generics="T">
	import type { SearchResultsImperativeHandle } from './SearchResults.svelte';
	import SearchResults, { control, makeObjectToString } from './SearchResults.svelte';

	interface Props {
		label: string;
		value: Array<T>;
		options?: Array<T>;
		prefix?: string;
		asString?: (t: T) => string;
	}

	const id = $props.id();

	let { label, value = $bindable(), options, prefix, asString }: Props = $props();

	let search = $state('');
	let searchRef: SearchResultsImperativeHandle | null = $state(null);
	const objToString = $derived(makeObjectToString(asString));
</script>

<div class="flex flex-row items-center gap-x-2">
	<label for="form-{id}"><pre>{label}</pre></label>
	<div
		class="relative m-2 flex flex-wrap items-center gap-1 rounded-xl border bg-white p-2 focus:border-blue-300"
	>
		{#each value as chip, i (chip)}
			<div class="flex w-max items-center rounded-lg border px-1 py-0.5">
				<button
					title="remove"
					class="cursor-pointer"
					onclick={() => {
						console.log('b', value, i, value.slice(0, i), value.slice(i + 1));
						value = [...value.slice(0, i), ...value.slice(i + 1)];
						console.log('a', value);
					}}><i class="fa-regular fa-circle-xmark text-sm text-gray-400"></i></button
				>
				<div>{prefix}{chip}</div>
			</div>
		{/each}
		<div class="relative">
			<span>#</span>
			<input id="form-{id}" type="text" class="" bind:value={search} {@attach control(searchRef)} />
			<SearchResults
				bind:this={searchRef}
				asString={objToString}
				{options}
				{search}
				onconfirm={(opt) => {
					search = objToString(opt);
				}}
			/>
		</div>
	</div>
</div>
