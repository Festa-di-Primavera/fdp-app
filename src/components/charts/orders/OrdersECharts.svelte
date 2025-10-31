<script lang="ts">
    import type { ChartData } from "$lib/charts/utils";
    import * as Card from "$lib/components/ui/card";
    import type { EChartsOption } from "echarts";
    import { PieChart } from "echarts/charts";
    import { GridComponent, TitleComponent } from "echarts/components";
    import { init, use } from "echarts/core";
    import { SVGRenderer } from "echarts/renderers";
    import { mode } from "mode-watcher";
    import { Chart } from "svelte-echarts";

    interface Props {
        ordersStats: ChartData;
    }
    let { ordersStats }: Props = $props();

    use([PieChart, GridComponent, SVGRenderer, TitleComponent]);
    const options: EChartsOption = $derived({
        legend: {
            orient: "horizontal",
            left: 10,
            data: ordersStats.labels,
            formatter: (name: string) => {
                return name;
            },
            textStyle: {
                color: mode.current == "dark" ? "white" : "black",
            },
        },
        backgroundColor: "transparent",
        tooltip: {
            trigger: "item",
            formatter: "{b}: {c}",
        },
        series: [
            {
                color: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
                type: "pie",
                radius: "60%",
                avoidLabelOverlap: false,
                label: {
                    show: true,
                    formatter: "{d}%",
                    color: mode.current == "dark" ? "white" : "black",
                },
                labelLine: {
                    show: true,
                    showAbove: true,
                    length2: 10,
                    length: 10,
                },
                labelLayout: {
                    moveOverlap: "shiftY",
                },
                data: ordersStats.labels.map((label, index) => ({
                    value: ordersStats.datasets[index],
                    name: label,
                    label: {
                        show: ordersStats.datasets[index] > 0,
                        color:
                            mode.current == "dark" ? "white" : "black",
                    },
                })),
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
        <Card.Title>Ordini per tipo</Card.Title>
        <Card.Description>
            Visualizza le percentuali dei diversi tipi di ordini
        </Card.Description>
    </Card.Header>
    <Card.Content class="h-full">
        {#if options !== null}
            <div class="h-full w-full">
                <Chart {init} {options} />
            </div>
        {/if}
    </Card.Content>
</Card.Root>