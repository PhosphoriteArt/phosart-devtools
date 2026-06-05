<script lang="ts">
	import type { Snippet } from 'svelte';
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
		icon?: string | Snippet;
		password?: boolean;
		noReportValidation?: true;
	}

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
	<div class="relative m-2 flex items-center rounded-xl">
		<label class="label">
			<span class="label-text font-light">{label}</span>
			<div class="input-group {icon ? 'grid-cols-[auto_1fr]' : ''}">
				{#if icon}
					<div class="ig-cell preset-tonal">
						{#if typeof icon === 'string'}
							<i
								aria-hidden="true"
								class="fa-solid fa-{icon} ml-1 text-gray-500"
								onclick={() => {
									inputRef?.focus();
								}}
							></i>
						{:else}
							{@render icon()}
						{/if}
					</div>
				{/if}

				<input
					type={password ? 'password' : 'text'}
					bind:value
					bind:this={inputRef}
					{placeholder}
					{onkeydown}
					{disabled}
					class:text-gray-400={disabled}
					class="input ig-input grow {cls}"
					class:bg-white={!disabled}
					class:bg-gray-100={disabled}
					onpointerdown={onclick}
					{@attach control(searchRef)}
				/>
			</div>
		</label>
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
