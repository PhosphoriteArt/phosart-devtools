<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		collapsed?: boolean;
		initial?: boolean;
		children?: Snippet;
		class?: string;
		collapsedRight?: Snippet;

		iconFamily?: string;
		openIcon?: string;
		closedIcon?: string;
	}

	let {
		title,
		collapsed = $bindable(undefined),
		initial,
		children,
		class: cls,
		collapsedRight,
		closedIcon,
		openIcon,
		iconFamily
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let uncontrolledCollapsed = $state(initial ?? true);

	let isCollapsed = $derived(collapsed ?? uncontrolledCollapsed);
</script>

<div class="overflow-hidden rounded-xl border border-primary-50-950 {cls}">
	<button
		tabindex="0"
		onkeypress={() => {
			if (collapsed !== undefined) {
				collapsed = !collapsed;
			}
			uncontrolledCollapsed = !uncontrolledCollapsed;
		}}
		onclick={() => {
			if (collapsed !== undefined) {
				collapsed = !collapsed;
			}
			uncontrolledCollapsed = !uncontrolledCollapsed;
		}}
		class="btn flex w-full cursor-pointer items-center justify-between rounded-t-lg select-none hover:bg-surface-700-300"
		class:rounded-b-lg={isCollapsed}
		class:rounded-b-none={!isCollapsed}
		class:pb-0={!isCollapsed}
	>
		<div class="flex items-center py-1">
			<i
				class="fa-{iconFamily ?? 'solid'} {isCollapsed
					? (closedIcon ?? 'fa-chevron-right')
					: (openIcon ?? 'fa-chevron-down')}"
			></i>
			<span>{title}</span>
		</div>
		{#if collapsedRight}
			<div>
				{@render collapsedRight?.()}
			</div>
		{/if}
	</button>
	{#if !isCollapsed}
		<div class="mb-4 border-b border-primary-50-950"></div>
		<div class="m-4">
			{@render children?.()}
		</div>
	{/if}
</div>
