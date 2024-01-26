<script lang="ts">
	import { Chart, Card, A, Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDown } from 'lucide-svelte';

	export let ticketsCheckIn: { x: string; y: number }[];
	export let numberOfCheckIns: number;

	let options: ApexCharts.ApexOptions;

	options = {
		colors: ['#1A56DB', '#FDBA8C'],
		series: [
			{
				name: 'CheckIn',
				color: '#1A56DB',
				data: ticketsCheckIn
			}
		],
		chart: {
			type: 'bar',
			height: '320px',
			fontFamily: 'Inter, sans-serif',
			toolbar: {
				show: false
			}
		},
		plotOptions: {
			bar: {
				horizontal: false,
				columnWidth: '70%',
				borderRadiusApplication: 'end',
				borderRadius: 8
			}
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
		grid: {
			show: false,
			strokeDashArray: 4,
			padding: {
				left: 2,
				right: 2,
				top: -14
			}
		},
		dataLabels: {
			enabled: false
		},
		legend: {
			show: false
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
</script>

<Card>
	<div class="mb-3 flex justify-between">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<h5
					class="mb-2 inline-flex items-center font-normal leading-none text-gray-500 dark:text-gray-400"
				>
					CheckIn
				</h5>
				<p class="text-2xl font-bold leading-none text-gray-900 dark:text-white">
					{numberOfCheckIns}
				</p>
			</div>
		</div>
		<div>
			<Button color="light" class="px-3 py-2"
				>Last week<ChevronDown class="ms-1.5 h-2.5 w-2.5" /></Button
			>
			<Dropdown class="w-40">
				<DropdownItem>Yesterday</DropdownItem>
				<DropdownItem>Today</DropdownItem>
				<DropdownItem>Last 7 days</DropdownItem>
				<DropdownItem>Last 30 days</DropdownItem>
				<DropdownItem>Last 90 days</DropdownItem>
			</Dropdown>
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
