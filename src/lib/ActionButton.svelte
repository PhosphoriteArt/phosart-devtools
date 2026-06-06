<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TooltipOptions } from './Tooltip.svelte';
	import Tooltip from './Tooltip.svelte';

	interface Props extends TooltipOptions {
		action?: (mev: MouseEvent) => Promise<void> | void;
		setLoading?: (loading: boolean) => void;
		children?: Snippet;
		loadingContent?: Snippet;
		class?: string;
		unstyled?: boolean;
		disabled?: boolean;
	}

	const {
		action,
		setLoading,
		children: subChild,
		loadingContent,
		class: userClass,
		disabled: userDisabled,
		unstyled,
		...tooltipOptions
	}: Props = $props();

	let loading = $state(false);
	const disabled = $derived(userDisabled || loading);

	const defaultCls = $derived(`btn preset-filled ${disabled ? 'disabled' : ''}`);
	const cls = $derived(
		(unstyled ? `${userClass ?? ''}` : `${defaultCls} ${userClass ?? ''}`) +
			(disabled ? ' cursor-not-allowed' : '')
	);

	function doAction(mev: MouseEvent) {
		if (!action || disabled) return;
		const maybePromise = action?.(mev);
		if (maybePromise) {
			loading = true;
			setLoading?.(true);
			maybePromise
				.then(() => /* do nothing */ null)
				.catch(() => /* do nothing */ null)
				.finally(() => {
					loading = false;
					setLoading?.(false);
				});
		}
	}
</script>

{#snippet defaultLoadingContent()}
	Loading...
{/snippet}

<Tooltip {...tooltipOptions}>
	{#snippet children(attach)}
		<button {@attach attach} onclick={doAction} class={cls} {disabled}>
			{#if !loading}
				{@render subChild?.()}
			{:else}
				{@render (loadingContent ?? defaultLoadingContent)()}
			{/if}
		</button>
	{/snippet}
</Tooltip>
