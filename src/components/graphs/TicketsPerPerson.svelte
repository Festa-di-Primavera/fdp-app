<script lang="ts">
	import { Card, Chart } from "flowbite-svelte";

	export let mappings: Map<string, number>;
	// create an array of {x: string, y: number} objects from mappings
	$: dataset = Array.from(mappings, ([x, y]) => ({x, y}));

	let options: ApexCharts.ApexOptions | null = null;

	$:{
		options = {
		chart: {
			type: 'bar'
		},
		series: [{
			data: dataset
		}]
		}
	}
</script>

<Card>
	<div class="flex w-full items-start justify-between">
		<div class="flex-col items-center">
			<div class="mb-1 flex items-center">
				<h5 class="me-1 text-xl font-bold leading-none text-gray-900 dark:text-white">Test</h5>
			</div>
		</div>
	</div>

	{#if options !== null}
		<Chart bind:options class="pt-6" />
	{/if}
</Card>