<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
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
		children,
		loadingContent,
		class: userClass,
		disabled: userDisabled,
		unstyled
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

<button onclick={doAction} class={cls} {disabled}>
	{#if !loading}
		{@render children?.()}
	{:else}
		{@render (loadingContent ?? defaultLoadingContent)()}
	{/if}
</button>
