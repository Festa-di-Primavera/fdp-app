<script lang="ts">
    import { init } from "$lib/charts/init";
    import type { ChartData } from "$lib/charts/utils";
    import { theme } from "$store/store";
    import { Card } from "flowbite-svelte";
    import { onMount } from "svelte";
    import { type EChartsOptions } from "svelte-echarts";
    import ChartComponent from "./ChartComponent.svelte";

    interface Props {
        sellersStats: ChartData;
    }
    let { sellersStats }: Props = $props();

    const MAX_VISIBLE_BARS = 4;

    const numberOfBars = $derived(sellersStats.labels.length);

    let displayChart = $state(false);

    onMount(() => {
        $theme = localStorage.getItem("color-theme") as "light" | "dark";
        setTimeout(() => {
            displayChart = true;
        }, 300);
    });

    theme.subscribe((value) => {
        $theme = value;
    });

    const options: EChartsOptions = $derived({
        grid: {
            containLabel: true,
            left: 10,
            right: 25,
        },
        backgroundColor: $theme == "dark" ? "rgb(31 41 55)" : "white",
        xAxis: {
            data: sellersStats.labels,
            axisLabel: {
                interval: 0,
                overflow: "truncate",
                color: $theme == "dark" ? "white" : "rgb(55 65 81)",
            },
            axisLine: {
                lineStyle: {
                    color: $theme == "dark" ? "white" : "rgb(55 65 81)",
                },
            },
        },
        yAxis: {
            show: true,
            offset: 5,
            splitLine: {
                show: true,
                interval: 3,
            },
            axisLine: {
                show: true,
                symbol: ["none", "arrow"],
                symbolSize: [8, 8],
                symbolOffset: [0, 8],
                lineStyle: {
                    color: $theme == "dark" ? "white" : "rgb(55 65 81)",
                },
            },
            axisLabel: {
                color: $theme == "dark" ? "white" : "rgb(55 65 81)",
            },
            minInterval: 5,
            min: 0,
            max: Math.ceil((Math.max(...sellersStats.datasets) + 1) / 5) * 5,
        },
        tooltip: {
            trigger: "item",
            axisPointer: {
                type: "shadow",
            },
            triggerOn: "click",
        },
        series: [
            {
                type: "bar",
                barWidth: "60%",
                data: sellersStats.datasets,
                labelLine: {
                    show: true,
                },
                name: "Biglietti Venduti",
                color: "#008b27",
            },
        ],
        // scorri il grafico con il mouse
        dataZoom: [
            {
                type: "inside",
                xAxisIndex: 0,
                start: 0,
                end:
                    numberOfBars > MAX_VISIBLE_BARS
                        ? 100 / (numberOfBars / MAX_VISIBLE_BARS)
                        : 100,
                zoomOnMouseWheel: true,
                moveOnMouseMove: true,
                moveOnMouseWheel: false,
            },
        ],
        toolbox: {
            show: true,
            bottom: 0,
            showTitle: false,
            itemSize: 20,
            feature: {
                saveAsImage: {
                    show: true,
                    type: "png",
                    name: "graph",
                    iconStyle: {
                        borderColor:
                            $theme == "dark" ? "white" : "rgb(55 65 81)",
                        borderWidth: 1.5,
                    },
                    icon: `path://M 7 10 L 12 15 L 17 10 M 21 15 v 4 a 2 2 0 0 1 -2 2 H 5 a 2 2 0 0 1 -2 -2 v -4 M 12 4 L 12 15`,
                    emphasis: {
                        iconStyle: {
                            borderColor: "#008b27",
                        },
                    },
                },
            },
        },
    } as EChartsOptions);
</script>

<Card class="h-96 w-full">
    <div class="flex w-full items-start justify-between">
        <div class="flex-col items-center">
            <div class="mb-1 flex items-center">
                <h5
                    class="me-1 text-xl font-bold leading-none text-gray-900 dark:text-white"
                >
                    Biglietti venduti a persona
                </h5>
            </div>
        </div>
    </div>

    {#if options !== null}
        <div class="mt-5 h-full w-full">
            {#if displayChart}
                <ChartComponent {options} {init} />
            {/if}
        </div>
    {/if}
</Card>
