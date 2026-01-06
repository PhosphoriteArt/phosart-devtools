<script lang="ts" generics="T">
	import SearchResults, {
		control,
		type SearchResultsImperativeHandle
	} from './SearchResults.svelte';

	interface Props {
		search?: string;
		options?: Record<string, T>;
		validationError?: string;
		noReportValidation?: true;
		onSelect?: (selected: string, option?: T) => void;
		onDeselect?: () => void;
		onComplete?: (completion: string) => void;

		class?: string;
		autoFocus?: boolean;
		acceptSuggestionOnEnter?: boolean;
		id?: string;
	}
	const id = $props.id();

	let {
		search: controlledSearch = $bindable(undefined),
		options,
		validationError,
		onSelect,
		onDeselect,
		noReportValidation,
		class: cls,
		autoFocus,
		id: userId,
		onComplete,
		acceptSuggestionOnEnter
	}: Props = $props();

	let uncontrolledSearch = $state('');

	const search = $derived(controlledSearch ?? uncontrolledSearch);

	let inputRef: HTMLInputElement | null = $state(null);
	let searchRef: SearchResultsImperativeHandle | null = $state(null);

	$effect(() => {
		if (validationError) {
			inputRef?.setCustomValidity(validationError);
			if (!noReportValidation) {
				inputRef?.reportValidity();
			}
		} else {
			inputRef?.setCustomValidity('');
		}
	});

	function setSearch(val: string) {
		if (controlledSearch !== undefined) {
			controlledSearch = val;
		}
		uncontrolledSearch = val;
	}

	export function getSearchRef(): SearchResultsImperativeHandle | null {
		return searchRef;
	}
</script>

<input
	{@attach (el) => {
		if (autoFocus) {
			el.focus();
		}
	}}
	id="form-{userId ?? id}"
	type="text"
	class:outline-2={!!validationError}
	class:outline-red-400={!!validationError}
	class={cls}
	bind:this={inputRef}
	bind:value={() => search, setSearch}
	{@attach control(searchRef, acceptSuggestionOnEnter)}
	onkeydown={(kev) => {
		if (kev.code === 'Enter') {
			onSelect?.(search, options?.[search] ?? undefined);
		} else if (!kev.altKey && !kev.ctrlKey && !kev.shiftKey && !kev.metaKey) {
			onDeselect?.();
		}
	}}
/>
<SearchResults
	bind:this={searchRef}
	{options}
	{search}
	onconfirm={(key) => {
		setSearch(key);
		inputRef?.focus();
		onComplete?.(key);
	}}
/>
