<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		icon?: string;
		onclick?: () => void;
		children?: Snippet;
	}

	const { children, icon, onclick }: Props = $props();
</script>

<button
	{onclick}
	class="m-1 cursor-pointer rounded-2xl border bg-white p-2 select-none hover:bg-gray-300 active:bg-gray-500"
>
	{#if icon}
		<i class="fa-solid fa-{icon}"></i>
	{/if}
	{#if children}
		<span class:pr-2={!!icon}>
			{@render children()}
		</span>
	{/if}
</button>
