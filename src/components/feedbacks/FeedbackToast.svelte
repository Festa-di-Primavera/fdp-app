<script lang="ts">
	import { Toast } from 'flowbite-svelte';
	interface Props {
		ToastIcon: any;
		open?: boolean;
		message?: string;
		color: 'green' | 'red' | 'yellow';
		onclose?: () => void;
	}

	let {
		ToastIcon = $bindable(),
		open = $bindable(false),
		message = $bindable(''),
		color = $bindable(),
		onclose = () => {}
	}: Props = $props();
	let textColorClass = $derived(
		color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-yellow-400'
	);
	let borderColorClass = $derived(
		color === 'green'
			? 'border-green-500'
			: color === 'red'
				? 'border-red-500'
				: 'border-yellow-500'
	);
</script>

<Toast
	on:close={() => {
		onclose();
		open = false;
	}}
	bind:toastStatus={open}
	{color}
	class="fixed left-0 right-0 top-20 z-[999] mx-auto mb-5 mt-10 w-max rounded-lg"
	divClass="w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3"
>
	<ToastIcon slot="icon" class="h-6 w-6 {textColorClass}"></ToastIcon>
	
	<span class="{textColorClass} font-semibold">{message}</span>
</Toast>
