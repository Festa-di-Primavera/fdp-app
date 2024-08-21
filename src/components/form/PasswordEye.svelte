<script lang="ts">
	import { Eye, EyeOff } from "lucide-svelte";

	export let pwVisible: boolean;
</script>

<button
	type="button"
	class="flex items-center justify-center"
	tabindex="-1"
	on:click={() => (pwVisible = !pwVisible)}
>
	{#if pwVisible}
		<EyeOff />
	{:else}
		<Eye />
	{/if}
</button>
