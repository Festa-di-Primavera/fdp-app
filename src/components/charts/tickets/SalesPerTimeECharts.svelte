<script lang="ts">
    import { type ChartData, SalesTimeSlot } from "$lib/charts/utils";
    import * as Card from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import { type EChartsOption } from "echarts";
    import { Chart } from "svelte-echarts";
    import { init, use } from "echarts/core";
    import { BarChart } from "echarts/charts";
    import { SVGRenderer } from "echarts/renderers";
    import { GridComponent, TitleComponent } from "echarts/components";
    import { mode } from "mode-watcher";

    const MAX_VISIBLE_BARS = 10;

    interface Props {
        ticketsData: ChartData;
        timeWindow: number;
    }

    let { ticketsData, timeWindow = $bindable() }: Props = $props();

    let selected: string = $state(SalesTimeSlot.DAY.toString());
    const timeOptions = new Map<string, string>([
        [SalesTimeSlot.TWELVE_HOURS.toString(), "12h"],
        [SalesTimeSlot.DAY.toString(), "1 giorno"],
        [SalesTimeSlot.TWO_DAYS.toString(), "2 giorni"],
        [SalesTimeSlot.WEEK.toString(), "1 settimana"],
        [SalesTimeSlot.TWO_WEEKS.toString(), "2 settimane"],
    ]);

    const numberOfBars = $derived(ticketsData.labels.length);
    const numberOfSales = $derived(
        ticketsData.datasets.reduce((acc, curr) => acc + curr, 0)
    );
    $effect(() => {
        timeWindow = parseInt(selected);
    });

    use([BarChart, SVGRenderer, TitleComponent, GridComponent]);
    const options: EChartsOption = $derived({
        parallelAxis: {
            show: false,
        },
        grid: {
            show: false,
            containLabel: true,
            left: 10,
            right: 25,
        },
        backgroundColor: "transparent",
        xAxis: {
            data: ticketsData.labels,
            axisLabel: {
                color: mode.current == "dark" ? "white" : "black",
            },
            axisLine: {
                show: true,
                lineStyle: {
                    color: mode.current == "dark" ? "white" : "black",
                },
            },
        },
        yAxis: {
            splitLine: {
                show: true,
                interval: 3,
            },
            show: true,
            offset: 5,
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
            max: Math.ceil((Math.max(...ticketsData.datasets) + 1) / 5) * 5,
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
                data: ticketsData.datasets,
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
                            mode.current == "dark" ? "white" : "black",
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
    });
</script>

<Card.Root class="min-h-[25rem]">
    <Card.Header class="mb-0 flex justify-between items-start">
        <div>
            <Card.Title>
                Vendite <br />
                <span class="text-2xl font-bold dodgerblue"
                    >{numberOfSales}</span
                >
            </Card.Title>
        </div>
        <div>
            <Select.Root type="single" bind:value={selected}>
                <Select.Trigger class="w-[180px]">
                    {timeOptions.get(selected)}
                </Select.Trigger>
                <Select.Content>
                    <Select.Group>
                        <Select.Label>Periodi</Select.Label>
                        {#each timeOptions as [value, name]}
                            <Select.Item
                                {value}
                                label={name}
                                class="cursor-pointer"
                            >
                                {name}
                            </Select.Item>
                        {/each}
                    </Select.Group>
                </Select.Content>
            </Select.Root>
        </div>
    </Card.Header>
    <Card.Content class="h-full">
        {#if options !== null}
            <div class="h-full w-full">
                <Chart {init} {options} />
            </div>
        {/if}
    </Card.Content>
</Card.Root>
