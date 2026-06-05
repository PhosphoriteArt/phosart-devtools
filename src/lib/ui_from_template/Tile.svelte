<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		title: string | Snippet;
		href?: string;
		onclick?: () => void;
		class?: string;
	}

	const { children, title, href, class: cls, onclick }: Props = $props();
</script>

{#snippet inner()}
	<div class="flex h-64 w-64 flex-wrap overflow-hidden rounded-2xl {cls ?? ''}">
		{@render children()}
	</div>
	<div class="nametag">
		<span>
			{#if typeof title === 'string'}
				{title}
			{:else}
				{@render title()}
			{/if}
		</span>
	</div>
{/snippet}

{#if href}
	<a {onclick} {href} class="tile">
		{@render inner()}
	</a>
{:else if onclick}
	<button {onclick} class="tile">
		{@render inner()}
	</button>
{:else}
	<span class="tile">
		{@render inner()}
	</span>
{/if}

<style lang="postcss">
	@reference '../../routes/layout.css';

	.tile {
		@apply inline-flex flex-col items-center overflow-hidden rounded-xl bg-surface-100-900 p-2 select-none;
		&:hover {
			@apply bg-surface-200-800;
			& .nametag {
				@apply bg-surface-300-700;
			}
		}

		&:active {
			@apply bg-surface-500;
			& .nametag {
				@apply bg-surface-200-800;
			}
		}
	}
	.nametag {
		@apply mx-3 my-1 mt-2 flex items-center justify-center rounded bg-surface-200-800 p-0.5 px-3;
	}
</style>
