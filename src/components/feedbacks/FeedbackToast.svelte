<script lang="ts">
	import { Toast } from 'flowbite-svelte';

	export let icon: ConstructorOfATypedSvelteComponent;
	export let open: boolean = false;
	export let message: string = '';
	export let color: 'green' | 'red' | 'yellow' = 'green';

	// create a fuction prop
	export let onclose: () => void = () => {};
</script>

<Toast
	on:close={() => {
		onclose();
		open = false;
	}}
	bind:toastStatus={open}
	{color}
	class="fixed left-0 right-0 top-20 z-[999] mx-auto mb-5 mt-10 w-max rounded-lg border-{color}-500"
	divClass="w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3 border"
>
	<svelte:component this={icon} class="h-6 w-6 text-{color}-400" slot="icon" />
	<span class="text-{color}-400 font-semibold">{message}</span>
</Toast>
