<script lang="ts">
	import type { SearchResultsImperativeHandle } from './search/SearchResults.svelte';
	import SearchResults, { arrAsObject, control } from './search/SearchResults.svelte';

	interface Props {
		label: string;
		value: string;

		placeholder?: string;
		disabled?: boolean;
		onkeydown?: (kev: KeyboardEvent) => void;
		onclick?: (mev: MouseEvent) => void;
		class?: string;
		validationError?: string;
		options?: string[];
		icon?: string;
		password?: boolean;
		labelClass?: string;
		noReportValidation?: true;
	}

	const id = $props.id();

	let {
		label,
		value = $bindable(),
		onkeydown,
		placeholder,
		class: cls,
		disabled,
		onclick,
		validationError,
		options,
		icon,
		password,
		labelClass,
		noReportValidation
	}: Props = $props();

	let inputRef: HTMLInputElement | null = $state(null);

	$effect(() => {
		if (!noReportValidation) {
			if (validationError) {
				inputRef?.setCustomValidity(validationError);
				inputRef?.reportValidity();
			} else {
				inputRef?.setCustomValidity('');
			}
			inputRef?.reportValidity();
		}
	});

	export function focus() {
		inputRef?.focus();
	}

	let searchRef: SearchResultsImperativeHandle | null = $state(null);
</script>

<div class="flex flex-row items-center gap-x-2">
	{#if label}
		<label for="form-{id}"><pre class={labelClass ?? 'w-36'}>{label}</pre></label>
	{/if}
	<div class="relative m-2 flex min-w-sm items-center rounded-xl border border-gray-500">
		{#if icon}
			<i
				aria-hidden="true"
				class="fa-solid fa-{icon} ml-1 text-gray-500"
				onclick={() => {
					inputRef?.focus();
				}}
			></i>
		{/if}
		<input
			id="form-{id}"
			type={password ? 'password' : 'text'}
			bind:value
			bind:this={inputRef}
			{placeholder}
			{onkeydown}
			{disabled}
			class:text-gray-400={disabled}
			class="grow rounded-xl p-2 focus:border-blue-300 {cls}"
			class:bg-white={!disabled}
			class:bg-gray-100={disabled}
			onpointerdown={onclick}
			{@attach control(searchRef)}
		/>
		{#if options}
			<SearchResults
				bind:this={searchRef}
				options={arrAsObject(options)}
				search={value}
				onconfirm={(key) => {
					value = key;
				}}
			/>
		{/if}
	</div>
</div>
