<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import { Chart, type EChartsOptions } from 'svelte-echarts';

	export let checkedTicketsCount: number;
	export let notCheckedTicketsCount: number;
	export let notSoldTicketsCount: number;

	// TODO: DETECT $theme change and update the chart

	$: options = {
		legend: {
			orient: 'horizontal',
			left: 10,
			data: ['Validati', 'Non validati', 'Non venduti'],
			formatter: (name: string) => {
				return name
			},
			textStyle: {
				color: 'gray',
			}
		},
		tooltip: {
			trigger: 'item',
			formatter: '{b}: {c}'
		},
		series: [
			{
				color: ['#4CAF50', '#FFC107', '#F44336'],
				type: 'pie',
				radius: '60%',
				avoidLabelOverlap: false,
				label: {
					show: true,
					formatter: '{d}%',
					color: 'gray',
				},
				labelLine: {
					show: true
				},
				data: [
					{
						value: checkedTicketsCount,
						name: 'Validati',
						label: {
							show: checkedTicketsCount > 0,
							color: 'gray',
						}
					},
					{
						value: notCheckedTicketsCount,
						name: 'Non validati',
						label: {
							show: notCheckedTicketsCount > 0,
							color: 'gray',
						}
					},
					{
						value: notSoldTicketsCount,
						name: 'Non venduti',
						label: {
							show: notSoldTicketsCount > 0,
							color: 'gray',
						}
					}
				]
			}
		]
	} as EChartsOptions;
</script>

<Card class="w-full h-96">
	<div class="flex w-full items-start justify-between">
		<div class="flex-col items-center">
			<div class="mb-1 flex items-center">
				<h5 class="me-1 text-xl font-bold leading-none text-gray-900 dark:text-white">Biglietti</h5>
			</div>
		</div>
	</div>

	{#if options !== null}
		<div class="pt-4 w-full h-full">
			<Chart bind:options />
		</div>
	{/if}
</Card>
