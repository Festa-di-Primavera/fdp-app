<script lang="ts">
	import type { ChartData } from '$lib/graphs/utils';
	import { Card } from 'flowbite-svelte';
	import { Chart, type EChartsOptions } from 'svelte-echarts';
	import { theme } from '../../store/store';

	let currentTheme = $theme;

	theme.subscribe((value) => {
		currentTheme = value;
	});

	export let sellersStats: ChartData;
	const MAX_VISIBLE_BARS = 4;

	$: numberOfBars = sellersStats.labels.length;
	$: options = {

		grid: {
			containLabel: true,
			left: 10,
			right: 25,
		},
        xAxis: {
            data: sellersStats.labels,
			axisLabel: {
				interval: 0,
				overflow: 'truncate',
				textStyle:{
					color: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)'
				}
			},
			axisLine: {
				lineStyle: {
					color: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)'
				}
			}
        },
        yAxis: {
			show: true,
			offset: 5,
			axisLine: {
				show: true,
				symbol: ['none', 'arrow'],
				symbolSize: [8, 8],
				symbolOffset: [0, 8],
				lineStyle: {
					color: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)'
				}
			},
			axisLabel: {
				textStyle:{
					color: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)'
				}
			},
			minInterval: 5,
			min: 0,
			max: Math.ceil(Math.max(...sellersStats.datasets) / 5) * 5,
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'shadow',
			},
			
			/*
				formatter: (item: any) => {
					return (`<div class="text-center bg-white dark:bg-gray-800">
								<div class="text-xs text-gray-500 dark:text-gray-400">${item.name}</div>
								<div class="text-lg font-semibold text-primary-700">${item.value}</div>
							</div>`);
				}, 
				extraCssText: 'padding: 10px; background: rgb(31 41 55);',
			*/
		},
        series: [
            {
                type: "bar",
				barWidth	: 60,
				data: sellersStats.datasets,
				labelLine: {
					show: true,
				},
				name: 'Biglietti Venduti',
				color: '#EF562F',
            }
		],
		// scorri il grafico con il mouse
		dataZoom:[ {
			type: 'inside',
			xAxisIndex: 0,
			start: 0,
			end: numberOfBars > MAX_VISIBLE_BARS ? 100 / (numberOfBars / MAX_VISIBLE_BARS) : 100,
			zoomOnMouseWheel: false,
			moveOnMouseMove: true,
			moveOnMouseWheel: true,

		}],
		/* toolbox: {
			show : true,
			feature : {
				saveAsImage : {show: true, type: 'jpeg', title: 'Save', name: 'graph'},
			}
		}, */
    } as EChartsOptions;
</script>

<Card class="w-full h-96">
	<div class="flex w-full items-start justify-between">
		<div class="flex-col items-center">
			<div class="mb-1 flex items-center">
				<h5 class="me-1 text-xl font-bold leading-none text-gray-900 dark:text-white">Biglietti venduti a persona</h5>
			</div>
		</div>
	</div>

	{#if options !== null}
		<div class="mt-5 w-full h-full">	
			<Chart bind:options/>
		</div>
	{/if}
</Card>
