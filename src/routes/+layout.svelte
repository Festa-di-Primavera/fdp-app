<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.pcss';
	import NavBar from '../components/NavBar.svelte';
	import { theme } from '../store/store';

	onMount(() => {
		if(!localStorage.getItem('color-theme'))
			localStorage.setItem('color-theme', 'dark');

		$theme = localStorage.getItem('color-theme') as 'light' | 'dark';
	});
</script>

<div class="min-h-[100svh] dark:bg-gray-800 flex flex-col">
	<NavBar />
	<slot />
</div>
