<script lang="ts">
	import { CircleX } from "@lucide/svelte";
	import type { PasswordHelperProps } from './types';

	let {
		children,
		enabled = true,
		color = "gray",
		icon = true,
		class: className,
		...restProps
	}: PasswordHelperProps = $props();

	// Solo mostra il helper se enabled è true
	const shouldShow = $derived(enabled);
</script>

{#if shouldShow}
	<div
		class="flex items-center gap-1 text-sm {color === 'red' ? 'text-red-500' : color === 'green' ? 'text-green-500' : 'text-neutral-500'} {className || ''}"
		{...restProps}
	>
		{#if icon}
			<CircleX class="h-3 w-3 shrink-0" />
		{/if}
		<span>
			{@render children?.()}
		</span>
	</div>
{/if}
