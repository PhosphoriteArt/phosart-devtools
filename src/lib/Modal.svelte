<script lang="ts">
	import type { Snippet } from 'svelte';
	import Tooltip, { type TooltipOptions } from './Tooltip.svelte';

	interface Props extends TooltipOptions {
		title: string;
		subtitle?: string;
		open?: boolean | null;
		children?: Snippet<[close: () => void]>;
		class?: string;
		buttonClass?: string;
		right?: Snippet;
		modalRight?: Snippet;
		icon?: string;
		hideHeader?: boolean;

		headless?: boolean;
		overrideOnClick?: (ev: MouseEvent | KeyboardEvent) => void;
		onClose?: () => void;
	}

	let {
		title,
		subtitle,
		open = $bindable(false),
		children,
		class: cls,
		buttonClass,
		right,
		modalRight,
		icon,
		onClose,
		hideHeader,
		overrideOnClick,
		headless,
		...tooltipOptions
	}: Props = $props();

	let dialog: HTMLDialogElement | null = $state(null);
	let childContainer: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (!dialog) return;

		const f = () => {
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
			<div class="rounded-2xl border {cls}" {@attach attach}>
				<div
					role="button"
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
					class="hover-effect flex h-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl px-2 select-none"
				>
					<div class="flex flex-col items-start {buttonClass}">
						<div class="font-semibold">
							{#if icon}
								<i class={icon}></i>
							{/if}
							{title}
						</div>
						{#if subtitle}
							<div class="text-xs text-gray-400">{subtitle}</div>
						{/if}
					</div>
					{#if right}
						<div>
							{@render right()}
						</div>
					{/if}
				</div>
			</div>
		{/snippet}
	</Tooltip>
{/if}

<dialog bind:this={dialog}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="fixed flex w-screen items-center justify-center bg-[#0004]"
		style="height: calc(100vh - 1.25rem)"
		role="button"
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				open = false;
			}
		}}
	>
		<div class="flex h-10/12 max-h-10/12 w-9/12 max-w-10/12 flex-col rounded-3xl bg-white">
			<div class="flex items-center justify-between border-b border-b-gray-400 p-4 py-0">
				{#if !hideHeader}
					<div class="flex flex-col items-start">
						<div class="font-semibold">{title}</div>
						{#if subtitle}
							<div class="text-xs text-gray-400">{subtitle}</div>
						{/if}
					</div>
				{/if}
				{#if modalRight}
					<div>
						{@render modalRight()}
					</div>
				{/if}
			</div>
			<div bind:this={childContainer} class="no-scrollbar grow overflow-scroll p-4">
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
