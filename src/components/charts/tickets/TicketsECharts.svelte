<script lang="ts">
    import type { EChartsOption } from "echarts";
    import { BarChart } from "echarts/charts";
    import { DataZoomComponent, GridComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent } from "echarts/components";
    import { init, use } from "echarts/core";
    import { SVGRenderer } from "echarts/renderers";
    import * as Card from "$lib/components/ui/card";
    import { mode } from "mode-watcher";
    import { Chart } from "svelte-echarts";

    interface Props {
        checkedTicketsCount: number;
        notCheckedTicketsCount: number;
        notSoldTicketsCount: number;
    }
    let {
        checkedTicketsCount,
        notCheckedTicketsCount,
        notSoldTicketsCount,
    }: Props = $props();

    use([BarChart, SVGRenderer, TitleComponent, GridComponent, LegendComponent, TooltipComponent, ToolboxComponent, DataZoomComponent]);
    const options: EChartsOption = $derived({
        legend: {
            orient: "horizontal",
            left: 10,
            data: ["Validati", "Non validati", "Non venduti"],
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
                color: ["#4CAF50", "#FFC107", "#F44336"],
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
                data: [
                    {
                        value: checkedTicketsCount,
                        name: "Validati",
                        label: {
                            show: checkedTicketsCount > 0,
                            color: mode.current == "dark" ? "white" : "black",
                        },
                    },
                    {
                        value: notCheckedTicketsCount,
                        name: "Non validati",
                        label: {
                            show: notCheckedTicketsCount > 0,
                            color: mode.current == "dark" ? "white" : "black",
                        },
                    },
                    {
                        value: notSoldTicketsCount,
                        name: "Non venduti",
                        label: {
                            show: notSoldTicketsCount > 0,
                            color: mode.current == "dark" ? "white" : "black",
                        },
                    },
                ],
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
        <Card.Title>Biglietti</Card.Title>
        <Card.Description>
            Visualizza lo stato dei biglietti venduti
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
