<script lang="ts">
	import { Toast } from "flowbite-svelte";
	import type { Icon } from "lucide-svelte";

	export let icon: ConstructorOfATypedSvelteComponent;
	export let open: boolean = false;
	export let message: string = '';
	export let color: 'green' | 'red' | 'yellow' = 'green';

	// create a fuction prop
	export let onclose: () => void = () => {};
</script>

<Toast on:close={() => {onclose(); open = false}} bind:open color={color} class="w-max mt-10 mb-5 mx-auto right-0 left-0 fixed top-20 z-[999]" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<svelte:component this={icon} class="w-6 h-6  text-{color}-400" slot="icon"/>
	<span class={`text-${color}-400 font-semibold`}>{message}</span>
</Toast>