<script lang="ts">
	import type { Snippet } from 'svelte';
	import Tooltip, { type TooltipOptions } from './Tooltip.svelte';

	interface Props extends TooltipOptions {
		title: string;
		buttonContent?: Snippet;
		open?: boolean | null;
		children?: Snippet<[close: () => void]>;
		class?: string;
		buttonClass?: string;
		modalRight?: Snippet<[close: () => void]>;
		icon?: Snippet;
		hideHeader?: boolean;
		disabled?: boolean;
		captive?: boolean;

		headless?: boolean;
		overrideOnClick?: (ev: MouseEvent | KeyboardEvent) => void;
		onClose?: () => void;
	}

	let {
		title,
		open = $bindable(false),
		children,
		class: cls,
		buttonClass,
		buttonContent,
		modalRight,
		icon,
		onClose,
		hideHeader,
		overrideOnClick,
		headless,
		disabled,
		captive,
		...tooltipOptions
	}: Props = $props();

	let dialog: HTMLDialogElement | null = $state(null);
	let childContainer: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (!dialog) return;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		captive;

		const f = (e: Event) => {
			if (captive) {
				e.preventDefault();
				return;
			}

			open = false;
		};

		dialog?.addEventListener('close', f);
		return () => {
			dialog?.removeEventListener('close', f);
		};
	});

	$effect(() => {
		if (!dialog) return;

		if (open) {
			if (!dialog.open) {
				dialog.showModal();
			}
		} else {
			if (dialog.open) {
				childContainer?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
				dialog.close();
				onClose?.();
			}
		}
	});

	export function setOpen(flag: boolean) {
		open = flag;
	}
</script>

{#if !headless}
	<Tooltip {...tooltipOptions}>
		{#snippet children(attach)}
			<button
				{@attach attach}
				{disabled}
				tabindex="0"
				onkeypress={(ev) => {
					if (overrideOnClick) {
						overrideOnClick(ev);
					} else {
						open = !open;
					}
				}}
				onclick={(ev) => {
					if (overrideOnClick) {
						overrideOnClick(ev);
					} else {
						open = !open;
					}
				}}
				class="btn {cls || 'preset-outlined btn-sm'}"
			>
				{#if typeof icon === 'string'}
					{icon}
				{:else}
					{@render icon?.()}
				{/if}
				{#if buttonContent}
					{@render buttonContent()}
				{:else}
					<div>
						{title}
					</div>
				{/if}
			</button>
		{/snippet}
	</Tooltip>
{/if}

<dialog
	bind:this={dialog}
	onkeydown={(ev) => {
		if (captive && ev.code === 'Escape') {
			ev.preventDefault();
		}
	}}
>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="fixed flex w-screen cursor-auto items-center justify-center bg-[#0004]"
		style="height: calc(100vh - 1.25rem)"
		role="button"
		onclick={(e) => {
			if (e.target === e.currentTarget && !captive) {
				open = false;
			}
		}}
	>
		<!-- h-10/12  w-9/12  -->
		<div
			class="flex max-h-10/12 max-w-10/12 flex-col rounded-3xl border border-surface-400-600 bg-surface-50-950 drop-shadow-xl drop-shadow-surface-50-950"
		>
			<div
				class="flex items-center justify-between border-surface-400-600"
				class:border-b={!hideHeader}
			>
				{#if !hideHeader}
					<div class="flex flex-col items-start px-4 py-1">
						<div class="font-semibold">{title}</div>
						<!-- {#if subtitle}
							<div class="text-xs text-gray-400">{subtitle}</div>
						{/if} -->
					</div>
				{/if}
				{#if modalRight}
					<div>
						{@render modalRight(() => void (open = false))}
					</div>
				{/if}
			</div>
			<div bind:this={childContainer} class="no-scrollbar grow overflow-scroll">
				{@render children?.(() => void (open = false))}
			</div>
		</div>
	</div>
</dialog>

<style lang="postcss">
	@reference "tailwindcss";

	.hover-effect:not(:has(*[data-blockhover]:hover)) {
		@apply hover:bg-gray-300 active:bg-gray-500;
	}
</style>
