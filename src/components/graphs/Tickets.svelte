<script lang="ts">
	import { Chart, Card } from 'flowbite-svelte';

	export let checkedTicketsCount: number;
	export let notCheckedTicketsCount: number;
	export let notSoldTicketsCount: number;

	let options: ApexCharts.ApexOptions | null = null;
	$: {
		options = {
			series: [checkedTicketsCount, notCheckedTicketsCount, notSoldTicketsCount],
			colors: ['#4fc14f', '#ffd547', '#f16650'],
			chart: {
				height: 420,
				width: '100%',
				type: 'pie',
				selection:{
					enabled: false
				}
			},
			stroke: {
				width: 1,
				colors: ['#fff']
			},
			states:{
				active: {
					filter: {
						type: 'none'
					}
				},
				hover: {
					filter: {
						type: 'none'
					}
				}
			},
			plotOptions: {
				pie: {
					labels: {
						show: false,
					},
					expandOnClick: false,
					customScale: 0.95,
					size: '100%',
					dataLabels: {
						offset: -25
					}
				}
			},
			labels: ['Validati', 'Venduti non validati', 'Non venduti'],
			dataLabels: {
				enabled: true,
				style: {
					colors: ['#fff']
				},
				dropShadow: {
					enabled: false
				}
			},
			tooltip: {
				enabled: true,
				theme: 'dark',
			},
			legend: {
				position: 'bottom',
				labels: {
					colors: '#888'
				},
				fontSize: '16rem',
				onItemClick: {
					toggleDataSeries: false
				},
				onItemHover: {
					highlightDataSeries: false
				},
			} as ApexLegend,
			yaxis: {
				labels: {
					style:{
						colors: '#000'
					},
					formatter: (value: number, opts?: any) => {
						return value + '';
					}
				}
			}
		} as ApexCharts.ApexOptions;
	}
</script>

<Card>
	<div class="flex w-full items-start justify-between">
		<div class="flex-col items-center">
			<div class="mb-1 flex items-center">
				<h5 class="me-1 text-xl font-bold leading-none text-gray-900 dark:text-white">Biglietti</h5>
			</div>
		</div>
	</div>

	{#if options !== null}
		<Chart bind:options class="pt-6" />
	{/if}
</Card>
