<script lang="ts">
    import { init } from "$lib/charts/init";
    import type { ChartData } from "$lib/charts/utils";
    import { theme } from "$store/store";
    import { Card } from "flowbite-svelte";
    import { onMount } from "svelte";
    import { type EChartsOptions } from "svelte-echarts";
    import ChartComponent from "../ChartComponent.svelte";

    interface Props {
        ordersStats: ChartData;
    }
    let { ordersStats }: Props = $props();

    let displayChart = $state(false);

    onMount(() => {
        $theme = localStorage.getItem("color-theme") as "light" | "dark";
        setTimeout(() => {
            displayChart = true;
        }, 300);
    });

    const options = $derived({
        legend: {
            orient: "horizontal",
            left: 10,
            data: ordersStats.labels,
            formatter: (name: string) => {
                return name;
            },
            textStyle: {
                color: $theme == "dark" ? "white" : "rgb(55 65 81)",
            },
        },
        backgroundColor: $theme == "dark" ? "#414041" : "white",
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
                    color: $theme == "dark" ? "white" : "rgb(55 65 81)",
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
                        color: $theme == "dark" ? "white" : "rgb(55 65 81)",
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

<Card
    class="h-96 w-full dark:bg-neutral-700 dark:border-neutral-500"
    padding="md"
>
    <div class="flex w-full items-start justify-between">
        <div class="flex-col items-center">
            <div class="mb-1 flex items-center">
                <h5
                    class="me-1 text-xl font-bold leading-none text-gray-900 dark:text-white"
                >
                    Ordini per tipo
                </h5>
            </div>
        </div>
    </div>

    {#if options !== null}
        <div class="h-full w-full pt-4">
            {#if displayChart}
                <ChartComponent {options} {init} />
            {/if}
        </div>
    {/if}
</Card>
