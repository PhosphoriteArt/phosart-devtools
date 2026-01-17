<script lang="ts" module>
	export interface KeyedSearch {
		asKey(): string;
	}
	export function hasKey<T>(t: T): t is T & KeyedSearch {
		return t && typeof t === 'object' && 'asKey' in t && typeof t.asKey === 'function';
	}
	export function addKey<T extends object>(arr: T[], keyer: (t: T) => string): (T & KeyedSearch)[] {
		return arr.map((t) => Object.assign(t, { asKey: () => keyer(t) }));
	}

	export interface Visualized {
		asVisualized(): string;
	}
	export function hasVisualize<T>(t: T): t is T & Visualized {
		return (
			t && typeof t === 'object' && 'asVisualized' in t && typeof t.asVisualized === 'function'
		);
	}
	export function addVisualization<T extends object>(
		arr: T[],
		visualizer: (t: T) => string
	): (T & Visualized)[] {
		return arr.map((t) => Object.assign(t, { asVisualized: () => visualizer(t) }));
	}

	export interface SearchResultsImperativeHandle<T = unknown> {
		increment(): void;
		decrement(): void;
		reset(): void;
		select(): boolean;
		getResults(): ReadonlyArray<Fuzzysort.KeysResult<[string, T]>>;
		getSelected(): number;
	}

	export function arrAsObject(arr: string[]): Record<string, string>;
	export function arrAsObject<T>(arr: T[], asString: (t: T) => string): Record<string, T>;
	export function arrAsObject<T>(arr: T[], asString?: (t: T) => string): Record<string, T> {
		return arr.reduce((acc, cur) => ({ ...acc, [asString?.(cur) ?? (cur as string)]: cur }), {});
	}

	export function control<T>(
		ctl: SearchResultsImperativeHandle<T> | undefined | null,
		acceptSuggestionOnEnter?: boolean
	): Attachment<HTMLElement> {
		return (el) => {
			if (!ctl) {
				return;
			}

			const evh = (kev: KeyboardEvent) => {
				if (kev.code === 'ArrowUp' && ctl.getResults().length > 0) {
					ctl.increment();
					kev.preventDefault();
				} else if (kev.code === 'ArrowDown' && ctl.getResults().length > 0) {
					ctl.decrement();
					kev.preventDefault();
				} else if (
					kev.code === 'Enter' &&
					ctl.getResults().length > 0 &&
					ctl.getSelected() >= 0 &&
					ctl.getSelected() < ctl.getResults().length
				) {
					ctl.select();
					kev.preventDefault();
				} else {
					if (!kev.shiftKey && !kev.metaKey && !kev.ctrlKey && !kev.altKey) {
						if (kev.code === 'Tab' || (acceptSuggestionOnEnter && kev.code === 'Enter')) {
							if (ctl.select()) {
								kev.preventDefault();
							}
						} else {
							ctl.reset();
						}
					}
				}
			};

			el.addEventListener('keydown', evh);
			return () => {
				el.removeEventListener('keydown', evh);
			};
		};
	}
</script>

<script lang="ts" generics="T">
	import fz from 'fuzzysort';
	import type { Attachment } from 'svelte/attachments';
	interface Props {
		search: string;
		onconfirm: (key: string, value: T) => void;
		options?: Record<string, T>;
		hasDefaultSelected?: boolean;
	}

	let { search, onconfirm, options, hasDefaultSelected }: Props = $props();

	let results: ReadonlyArray<Fuzzysort.KeysResult<[string, T]>> = $derived.by(() => {
		if (!options) {
			return [];
		}

		return fz.go(search, Object.entries(options), {
			limit: 10,
			keys: [([k, v]) => (hasKey(v) ? v.asKey() : k)],
			scoreFn(kr): number {
				if (kr.obj[0].startsWith('[new]')) {
					return kr.score;
				}

				return kr.score * 2;
			}
		});
	});

	let justConfirmed = $state(true);
	let enableKeyboardSelector = $state(true);
	let showPicker = $derived(results.length > 0 && !justConfirmed);
	let selected = $state(hasDefaultSelected ? 0 : -1);
	let refs: Array<HTMLButtonElement> = [];

	let container: HTMLDivElement | null = $state(null);

	const manageRef: (i: number) => Attachment<HTMLButtonElement> = (i: number) => (el) => {
		refs[i] = el;
	};

	function scrollTarget(contained: HTMLElement, container: HTMLElement): number {
		return contained.offsetTop - container.clientHeight / 2 + contained.clientHeight / 2;
	}

	function scrollContainerToContained(
		contained: HTMLElement | undefined | null,
		container: HTMLElement | undefined | null
	) {
		if (!container || !contained) {
			return;
		}

		container.scrollTo({
			behavior: 'smooth',
			top: scrollTarget(contained, container)
		});
	}

	export function increment(): void {
		selected = (selected + results.length - 1) % results.length;

		scrollContainerToContained(refs[selected], container);
	}
	export function decrement(): void {
		selected = (selected + 1) % results.length;
		scrollContainerToContained(refs[selected], container);
	}
	export function reset(): void {
		justConfirmed = false;
		selected = hasDefaultSelected ? 0 : -1;
	}
	export function select(): boolean {
		if (justConfirmed || results.length == 0) {
			return false;
		}
		if (selected < 0 || selected >= results.length) selected = 0;
		const [k, v] = results[selected].obj;
		onconfirm(k, v);
		selected = hasDefaultSelected ? 0 : -1;
		justConfirmed = true;
		return true;
	}
	export function getResults(): ReadonlyArray<Fuzzysort.KeysResult<[string, T]>> {
		return results;
	}
	export function getSelected(): number {
		return selected;
	}
</script>

{#if showPicker}
	<div
		class="absolute top-full z-10 flex max-h-20 w-full flex-col overflow-y-scroll bg-white select-none"
		onpointerenter={() => void (enableKeyboardSelector = false)}
		onpointerleave={() => void (enableKeyboardSelector = true)}
		bind:this={container}
	>
		{#each results as result, i (result.obj[0])}
			{@const key = result.obj[0]}
			{@const value = result.obj[1]}
			<button
				onclick={() => {
					const [k, v] = result.obj;
					onconfirm(k, v);
					selected = hasDefaultSelected ? 0 : -1;
					justConfirmed = true;
				}}
				class="cursor-pointer text-left hover:bg-blue-300"
				class:border-b={i != results.length - 1}
				class:bg-blue-300={selected === i && enableKeyboardSelector}
				{@attach manageRef(i)}
			>
				{hasVisualize(value) ? value.asVisualized() : hasKey(value) ? value.asKey() : key}
			</button>
		{/each}
	</div>
{/if}
