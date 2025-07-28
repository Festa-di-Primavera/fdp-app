<script lang="ts">
    import type { ChartData } from "$lib/charts/utils";
    import type { EChartsOption } from "echarts";
    import { BarChart } from "echarts/charts";
    import { GridComponent, TitleComponent } from "echarts/components";
    import { init, use } from "echarts/core";
    import { SVGRenderer } from "echarts/renderers";
    import * as Card from "$lib/components/ui/card";
    import { mode } from "mode-watcher";
    import { Chart } from "svelte-echarts";

    interface Props {
        sellHoursStats: ChartData;
    }

    let { sellHoursStats }: Props = $props();

    use([BarChart, SVGRenderer, TitleComponent, GridComponent]);
    const options: EChartsOption = $derived({
        grid: {
            containLabel: true,
            left: 10,
            right: 25,
        },
        backgroundColor: "transparent",
        xAxis: {
            data: sellHoursStats.labels,
            axisLabel: {
                color: mode.current == "dark" ? "white" : "black",
            },
            axisLine: {
                lineStyle: {
                    color: mode.current == "dark" ? "white" : "black",
                },
            },
        },
        yAxis: {
            show: true,
            offset: 5,
            splitLine: {
                show: true,
            },
            axisLine: {
                show: true,
                symbol: ["none", "arrow"],
                symbolSize: [8, 8],
                symbolOffset: [0, 8],
                lineStyle: {
                    color: mode.current == "dark" ? "white" : "black",
                },
            },
            axisLabel: {
                color: mode.current == "dark" ? "white" : "black",
            },
            minInterval: 5,
            min: 0,
            max: Math.ceil((Math.max(...sellHoursStats.datasets) + 1) / 5) * 5,
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
                barWidth: "80%",
                data: sellHoursStats.datasets,
                labelLine: {
                    show: true,
                },
                name: "Biglietti Venduti",
                color: "dodgerblue",
            },
        ],
        // scorri il grafico con il mouse
        dataZoom: [
            {
                type: "inside",
                xAxisIndex: 0,
                start: 0,
                end: 100,
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
                            mode.current == "dark" ? "white" : "black",
                        borderWidth: 1.5,
                    },
                    icon: `path://M 7 10 L 12 15 L 17 10 M 21 15 v 4 a 2 2 0 0 1 -2 2 H 5 a 2 2 0 0 1 -2 -2 v -4 M 12 4 L 12 15`,
                    emphasis: {
                        iconStyle: {
                            borderColor: "dodgerblue",
                        },
                    },
                },
            },
        },
    });
</script>

<Card.Root class="min-h-[25rem]">
    <Card.Header class="mb-0">
        <Card.Title>Vendite per Fascia Oraria</Card.Title>
        <Card.Description>
            Visualizza le vendite distribuite per ora
        </Card.Description>
    </Card.Header>
    <Card.Content class="h-full">
        {#if options !== null}
            <div class="h-full w-full">
                <Chart {options} {init} />
            </div>
        {/if}
    </Card.Content>
</Card.Root>
