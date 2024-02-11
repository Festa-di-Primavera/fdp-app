<script lang="ts">
	import { type ChartData, SalesTimeSlot } from "$lib/graphs/utils";
	import { Card, Select, type SelectOptionType } from "flowbite-svelte";
	import { Chart, type EChartsOptions } from "svelte-echarts";
	
	const MAX_VISIBLE_BARS = 7;

	export let ticketsData: ChartData;
	export let timeWindow: number;

	
	let selected: SalesTimeSlot = SalesTimeSlot.DAY;
	const timeOptions = [
		{ value: SalesTimeSlot.TWELVE_HOURS, name: '12h' },
		{ value: SalesTimeSlot.DAY, name: '1 day' },
		{ value: SalesTimeSlot.TWO_DAYS, name: '2 day' },
		{ value: SalesTimeSlot.WEEK, name: '7 day' },
		{ value: SalesTimeSlot.TWO_WEEKS, name: '2 weeks' }
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
        },
        yAxis: {
			show: true,
			offset: 5,
			axisLine: {
				show: true,
				symbol: ['none', 'arrow'],
				symbolSize: [8, 8],
				symbolOffset: [0, 8],
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
			/* formatter: (item: any) => {
				return (`<div class="text-center bg-white dark:bg-gray-800">
							<div class="text-xs text-gray-500 dark:text-gray-400">${item.name}</div>
							<div class="text-lg font-semibold text-primary-700">${item.value}</div>
						</div>`);
			}, 
			extraCssText: 'padding: 10px; background: rgb(31 41 55);',*/
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

		}],
		/* toolbox: {
			show : true,
			feature : {
				magicType: {show: true, type: ['line', 'bar']},
				saveAsImage : {show: true, type: 'jpeg', title: 'Save', name: 'graph'}
			}
		}, */
    } as EChartsOptions;
</script>

<Card class="w-full h-96">
	<div class="mb-3 flex justify-between">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<h5 class="mb-2 inline-flex items-center font-normal leading-none text-gray-500 dark:text-gray-400">
					Vendite
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
