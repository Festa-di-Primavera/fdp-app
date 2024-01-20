<script lang="ts">
	import { onMount } from 'svelte';

	export let data;

	onMount(()=>{
		console.log(data);
	});
	
</script>

<h1 class="text-primary-600">DASHBOARD</h1>
<p>Questa e' la dashboard</p>
