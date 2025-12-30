<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		collapsed?: boolean;
		initial?: boolean;
		children?: Snippet;
		class?: string;
		collapsedRight?: Snippet;
	}

	let {
		title,
		collapsed = $bindable(undefined),
		initial,
		children,
		class: cls,
		collapsedRight
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let uncontrolledCollapsed = $state(initial ?? true);

	let isCollapsed = $derived(collapsed ?? uncontrolledCollapsed);
</script>

<div class="rounded-2xl border {cls}">
	<div
		role="button"
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
		class="flex cursor-pointer items-center justify-between select-none"
		class:pb-0={!isCollapsed}
	>
		<div class="flex items-center p-4">
			<i class="fa-solid" class:fa-chevron-right={isCollapsed} class:fa-chevron-down={!isCollapsed}
			></i>
			<span>{title}</span>
		</div>
		{#if collapsedRight}
			<div>
				{@render collapsedRight?.()}
			</div>
		{/if}
	</div>
	{#if !isCollapsed}
		<div class="p-4">
			<div class="mb-4 border-b border-gray-300"></div>
			{@render children?.()}
		</div>
	{/if}
</div>
