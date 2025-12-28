<script lang="ts" module>
	export function makeObjectToString<T>(provided?: (t: T) => string): (t: T) => string {
		return (
			provided ??
			((t: T) => {
				if (t && typeof t === 'object' && 'toString' in t && typeof t.toString === 'function') {
					const s = t.toString();
					if (typeof s === 'string') {
						return s;
					}
				}
				throw new Error('t had no toString');
			})
		);
	}

	export interface SearchResultsImperativeHandle {
		increment(): void;
		decrement(): void;
		reset(): void;
		select(): void;
		getResults(): ReadonlyArray<unknown>;
		getSelected(): number;
	}

	export function control(
		ctl: SearchResultsImperativeHandle | undefined | null
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
						ctl.reset();
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
		onconfirm: (t: T) => void;
		options?: Array<T>;
		asString: (t: T) => string;
	}

	let { search, onconfirm, options, asString }: Props = $props();

	let results: ReadonlyArray<Fuzzysort.KeyResult<T>> = $derived.by(() => {
		if (!options) {
			return [];
		}

		return fz.go<T>(search, options, {
			limit: 10,
			key: asString
		});
	});
	let justConfirmed = $state(false);
	let enableKeyboardSelector = $state(true);
	let showPicker = $derived(results.length > 0 && !justConfirmed);
	let selected = $state(-1);
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
		selected = -1;
	}
	export function select(): void {
		onconfirm(results[selected].obj);
		selected = -1;
		justConfirmed = true;
	}
	export function getResults(): ReadonlyArray<Fuzzysort.KeyResult<T>> {
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
		{#each results as result, i (result.target)}
			<button
				onclick={() => {
					onconfirm(result.obj);
					selected = -1;
					justConfirmed = true;
				}}
				class="cursor-pointer text-left hover:bg-blue-300"
				class:border-b={i != results.length - 1}
				class:bg-blue-300={selected === i && enableKeyboardSelector}
				{@attach manageRef(i)}
			>
				{result.target}
			</button>
		{/each}
	</div>
{/if}
