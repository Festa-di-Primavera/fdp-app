<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import { Chart, type EChartsOptions } from 'svelte-echarts';
	import { theme } from '../../store/store';

	export let checkedTicketsCount: number;
	export let notCheckedTicketsCount: number;
	export let notSoldTicketsCount: number;

	let currentTheme = $theme;

	theme.subscribe((value) => {
		currentTheme = value;
	});

	$: options = {
		legend: {
			orient: 'horizontal',
			left: 10,
			data: ['Validati', 'Non validati', 'Non venduti'],
			formatter: (name: string) => {
				return name
			},
			textStyle: {
				color: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)'
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
					color: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)'
				},
				labelLine: {
					show: true,
					showAbove: true,
					length2: 10,
					length: 10
				},
				labelLayout: {
					moveOverlap: 'shiftY'
				},
				data: [
					{
						value: checkedTicketsCount,
						name: 'Validati',
						label: {
							show: checkedTicketsCount > 0,
							color: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)'
						}
					},
					{
						value: notCheckedTicketsCount,
						name: 'Non validati',
						label: {
							show: notCheckedTicketsCount > 0,
							color: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)'
						}
					},
					{
						value: notSoldTicketsCount,
						name: 'Non venduti',
						label: {
							show: notSoldTicketsCount > 0,
							color: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)'
						}
					}
				],
				tooltip:{
					extraCssText: `background-color: ${currentTheme == 'dark' ? 'rgb(55 65 81)' : 'white'}; border-width: 2px; color: ${currentTheme == 'light' ? 'rgb(55 65 81)' : 'white'};`
				}
			}
		]
	} as EChartsOptions;
</script>

<Card class="w-full h-96" padding="md">
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
