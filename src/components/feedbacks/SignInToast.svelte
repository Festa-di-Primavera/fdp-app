<script lang="ts">
	import { Toast } from "flowbite-svelte";
	import { XCircle } from "lucide-svelte";

	export let open: boolean = false;
	export let message: string = '';
</script>

<Toast on:close={() => open = false} bind:open color="red" class="w-max mt-10 mb-5 mx-auto right-0 left-0 fixed top-20 z-[999]" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<XCircle class="w-6 h-6  text-red-400" slot="icon"/>
	<span class='text-red-400 font-semibold'>{message}</span>
</Toast>