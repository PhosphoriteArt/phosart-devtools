<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		icon?: string;
		onclick?: () => void;
		children?: Snippet;
	}

	const { children, icon, onclick }: Props = $props();
</script>

<button {onclick} class="rounded-2xl border p-2">
	{#if icon}
		<i class="fa-solid fa-{icon}"></i>
	{/if}
	{#if children}
		<span class:pr-2={!!icon}>
			{@render children()}
		</span>
	{/if}
</button>
