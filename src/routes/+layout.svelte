<script lang="ts">
	import '../app.pcss';
	import NavBar from '../components/NavBar.svelte';
</script>

<div class="min-h-[100svh] dark:bg-gray-800 flex flex-col">
	<NavBar />
	<slot />
</div>
