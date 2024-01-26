<script lang="ts">
	import { Card, Chart } from 'flowbite-svelte';

	export let mappings: Map<string, number>;
	// create an array of {x: string, y: number} objects from mappings
	$: dataset = Array.from(mappings, ([x, y]) => ({ x, y }));

	let options: ApexCharts.ApexOptions | null = null;

	$: {
		options = {
			colors: ['#F05252'],
			chart: {
				type: 'bar',
				height: '320px',
				fontFamily: 'Inter, sans-serif',
				toolbar: {
					show: false
				}
			},
			series: [
				{
					name: 'Biglietti venduti',
					color: '#F05252',
					data: dataset
				}
			],
			tooltip:{
				enabled: false
			},
			xaxis: {
				floating: false,
				labels: {
					show: true,
					style: {
						fontFamily: 'Inter, sans-serif',
						cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
					}
				},
				axisBorder: {
					show: false
				},
				axisTicks: {
					show: false
				}
			},
			yaxis: {
				labels: {
					show: true,
					style: {
						fontFamily: 'Inter, sans-serif',
						cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
					}
				},
			},
			fill: {
				opacity: 1
			}
		};
	}
</script>

<Card>
	<div class="flex w-full items-start justify-between">
		<div class="flex-col items-center">
			<div class="mb-1 flex items-center">
				<h5 class="me-1 text-xl font-bold leading-none text-gray-900 dark:text-white">Biglietti venduti a persona</h5>
			</div>
		</div>
	</div>

	{#if options !== null}
		<Chart bind:options class="pt-6" />
	{/if}
</Card>
