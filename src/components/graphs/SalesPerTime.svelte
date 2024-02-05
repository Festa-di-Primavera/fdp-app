<script lang="ts">
	import { Chart, Card, A, Select, Label } from 'flowbite-svelte';
	import { ChevronDown } from 'lucide-svelte';

	export let ticketsSolds: { x: string; y: number }[];
	export let numberOfSales: number;
	export let timeWindow: number;
	export let numberOfBar: number;

	let selected: number = (24 * 60 * 60 * 1000) / numberOfBar;
	let timeOptions = [
		{ value: (60 * 60 * 1000) / numberOfBar, name: '1h' },
		{ value: (2 * 60 * 60 * 1000) / numberOfBar, name: '2h' },
		{ value: (4 * 60 * 60 * 1000) / numberOfBar, name: '4h' },
		{ value: (6 * 60 * 60 * 1000) / numberOfBar, name: '6h' },
		{ value: (12 * 60 * 60 * 1000) / numberOfBar, name: '12h' },
		{ value: (24 * 60 * 60 * 1000) / numberOfBar, name: '1 day' },
		{ value: (2 * 24 * 60 * 60 * 1000) / numberOfBar, name: '2 day' },
		{ value: (7 * 24 * 60 * 60 * 1000) / numberOfBar, name: '7 day' },
		{ value: (2 * 7 * 24 * 60 * 60 * 1000) / numberOfBar, name: '2 weeks' }
	];

	$: {
		timeWindow = selected;
	}

	let options: ApexCharts.ApexOptions;

	options = {
		chart: {
			id: 'chart-1',
			type: 'bar',
			height: '250px',
			fontFamily: 'Inter, sans-serif',
			toolbar: {
				autoSelected: 'pan',
				show: false
			}
		},
		colors: ['#1A56DB', '#FDBA8C'],
		dataLabels: {
			enabled: false
		},
		fill: {
			opacity: 1
		},
		grid: {
			show: false,
			strokeDashArray: 4,
			padding: {
				left: 2,
				right: 2,
				top: -30
			}
		},
		legend: {
			show: false
		},
		series: [
			{
				name: 'CheckIn',
				color: '#1A56DB',
				data: ticketsSolds
			}
		],
		plotOptions: {
			bar: {
				horizontal: false,
				columnWidth: '70%',
				borderRadiusApplication: 'end',
				borderRadius: 8
			}
		},
		states: {
			hover: {
				filter: {
					type: 'darken',
					value: 1
				}
			}
		},
		stroke: {
			show: true,
			width: 0,
			colors: ['transparent']
		},
		tooltip: {
			shared: true,
			intersect: false,
			style: {
				fontFamily: 'Inter, sans-serif'
			},
			x: {
				show: false
			}
		},
		xaxis: {
			type: 'datetime',
			labels: {
				show: true,
				style: {
					fontFamily: 'Inter, sans-serif',
					cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
				},
				datetimeFormatter: {
					year: 'yyyy',
					month: "MMM 'yy",
					day: 'dd MMM',
					hour: 'HH:mm'
				}
			},
			axisBorder: {
				show: false
			},
			axisTicks: {
				show: false
			},
			floating: false
		},
		yaxis: {
			show: false
		}
	};

	$: {
		if (options && options.series && options.series[0]) {
			(
				options.series[0] as {
					name?: string;
					type?: string;
					color?: string;
					group?: string;
					zIndex?: number;
					data:
						| (number | null)[]
						| {
								x: any;
								y: any;
								fill?: ApexFill;
								fillColor?: string;
								strokeColor?: string;
								meta?: any;
								goals?: any;
								barHeightOffset?: number;
								columnWidthOffset?: number;
						  }[]
						| [number, number | null][]
						| [number, (number | null)[]][]
						| number[][];
				}
			).data = ticketsSolds;
		}
	}
</script>

<Card>
	<div class="mb-3 flex justify-between">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<h5
					class="mb-2 inline-flex items-center font-normal leading-none text-gray-500 dark:text-gray-400"
				>
					Sales
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
	<!-- <div class="grid grid-cols-1 items-center border-gray-200 border-t dark:border-gray-700 justify-between mt-2.5">
      <div class="pt-5">
        <Button href="/" class="px-4 py-2.5 text-sm font-medium text-white inline-flex items-center bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
          <FileLinesSolid class="w-3.5 h-3.5 text-white me-2" />
          View full report
        </Button>
      </div>
    </div> -->
</Card>
