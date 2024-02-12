<script lang="ts">
	import { type ChartData, CheckInTimeSlot } from "$lib/graphs/utils";
	import { Card, Select } from "flowbite-svelte";
	import { Chart, type EChartsOptions } from "svelte-echarts";
	import { theme } from "../../store/store";

	let currentTheme = $theme;

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
			max: Math.ceil(Math.max(...ticketsData.datasets) / 5) * 5,
		},
		tooltip: {
			trigger: 'axis',
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
			zoomOnMouseWheel: false,
			moveOnMouseMove: true,
			moveOnMouseWheel: true,

		}]
    } as EChartsOptions;
</script>

<Card class="w-full h-96">
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
	<Chart {options} />
</Card>
