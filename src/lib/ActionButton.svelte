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
		disabled,
		unstyled
	}: Props = $props();

	let loading = $state(false);

	const defaultCls = $derived(
		`rounded-xl border transition p-1 px-2 ${disabled ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-white hover:bg-gray-300 active:bg-gray-500 cursor-pointer shadow-sm shadow-gray-400  active:shadow-none'}`
	);
	const cls = $derived(unstyled ? `${userClass ?? ''}` : `${defaultCls} ${userClass ?? ''}`);

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
