<script lang="ts">
	import { type ChartData, CheckInTimeSlot } from "$lib/graphs/utils";
	import { Card, Select } from "flowbite-svelte";
	import { Chart, type EChartsOptions } from "svelte-echarts";
	import { theme } from "../../store/store";
	import { onMount } from "svelte";

	let currentTheme: 'dark' | 'light';

	onMount(() => {
		$theme = localStorage.getItem('color-theme') as 'light' | 'dark';
	});

	theme.subscribe((value) => {
		currentTheme = value;
	});
	
	const MAX_VISIBLE_BARS = 16;

	export let ticketsData: ChartData;
	export let timeWindow: number;

	let selected: CheckInTimeSlot = CheckInTimeSlot.HOUR;
	const timeOptions = [
		{ value: CheckInTimeSlot.FIFTEEN_MINUTES, name: '15 min ' },
		{ value: CheckInTimeSlot.HALF_HOUR, name: '30 min' },
		{ value: CheckInTimeSlot.HOUR, name: '1 ora' },
		{ value: CheckInTimeSlot.TWO_HOURS, name: '2 ore' }
	];
	
	$: numberOfBars = ticketsData.labels.length;
	$: numberOfSales = ticketsData.datasets.reduce((acc, curr) => acc + curr, 0);
	$: timeWindow = selected;
	$: options = {
		grid: {
			containLabel: true,
			left: 10,
			right: 25,
		},
        xAxis: {
            data: ticketsData.labels,
			axisLabel: {
				formatter: (value: string) => {
					// replace , with \n
					return value.replace(/,/g, '\n');
				},
				color: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)'
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
				color: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)'
			},
			minInterval: 5,
			min: 0,
			max: Math.ceil(Math.max(...ticketsData.datasets) / 5) * 5,
		},
		tooltip: {
			trigger: 'item',
			axisPointer: {
				type: 'shadow',
			},
		},
        series: [
            {
                type: "bar",
				data: ticketsData.datasets,
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
			zoomOnMouseWheel: true,
			moveOnMouseMove: true,
			moveOnMouseWheel: false
		}],
		toolbox: {
			show : true,
			bottom: 0,
			showTitle: false,
			itemSize: 20,
			feature : {
				saveAsImage: {
					show: true, 
					type: 'png', 
					
					name: 'graph',
					iconStyle: {
						borderColor: currentTheme == 'dark' ? 'white' : 'rgb(55 65 81)',
						borderWidth: 1.5,
						
					},
					icon: `path://M 7 10 L 12 15 L 17 10 M 21 15 v 4 a 2 2 0 0 1 -2 2 H 5 a 2 2 0 0 1 -2 -2 v -4 M 12 4 L 12 15`,
					emphasis:{
						iconStyle:{
							borderColor: '#EF562F'
						}
					}
				},
			}
		},
    } as EChartsOptions;
</script>

<Card class=" w-full h-96">
	<div class="mb-3 flex justify-between">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<h5 class="mb-2 inline-flex items-center font-normal leading-none text-gray-500 dark:text-gray-400">
					Check-in
				</h5>
				<p class="text-2xl font-bold leading-none text-gray-900 dark:text-white">
					{numberOfSales}
				</p>
			</div>
		</div>
		<div>
			<Select
				class="mt-2"
				items={timeOptions}
				bind:value={selected}
				placeholder="Scegli un'opzione"
			/>
		</div>
	</div>
	<Chart renderer="svg" {options}/>
</Card>
