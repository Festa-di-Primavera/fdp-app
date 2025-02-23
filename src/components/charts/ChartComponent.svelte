<script lang="ts">
    import type {
        init as baseInit,
        EChartsType as BaseEchartsType,
        EChartsOption,
        SetOptionOpts,
    } from "echarts";
    import type {
        init as coreInit,
        EChartsType as CoreEchartsType,
    } from "echarts/core";
    import type { EChartsInitOpts } from "echarts";
    import { createEventDispatcher, onMount } from "svelte";
    import { EVENT_NAMES, type EventHandlers } from "../../lib/charts/events";

    interface Props {
        init: typeof baseInit | typeof coreInit;
        theme?: string | object | null;
        initOptions?: EChartsInitOpts;
        options: EChartsOption;
        notMerge?: SetOptionOpts["notMerge"]; // deviation from ECharts default, works better with Svelte
        lazyUpdate?: SetOptionOpts["lazyUpdate"];
        silent?: SetOptionOpts["silent"];
        replaceMerge?: SetOptionOpts["replaceMerge"];
        transition?: SetOptionOpts["transition"];
        chart?: (BaseEchartsType | CoreEchartsType) | undefined;
    }

    let {
        init,
        theme = "light",
        initOptions = {},
        options,
        notMerge = true,
        lazyUpdate = false,
        silent = false,
        replaceMerge = undefined,
        transition = undefined,
        chart = $bindable(undefined)
    }: Props = $props();

    let element: HTMLDivElement | undefined = $state();

    $effect(() => {
        if (chart)
            chart.setOption(options, {
                notMerge,
                lazyUpdate,
                silent,
                replaceMerge,
                transition,
            });
    });

    const dispatch = createEventDispatcher<EventHandlers>();

    const initChart = () => {
        if (chart) chart.dispose();

        chart = init(element, theme, initOptions);

        EVENT_NAMES.forEach((eventName) => {
            // @ts-expect-error
            chart!.on(eventName, (event) => dispatch(eventName, event));
        });
    };

    onMount(() => {
        if (element) {
            const resizeObserver = new ResizeObserver(() => {
                if (!chart) initChart();
                else chart.resize();
            });
            resizeObserver.observe(element);

            return () => {
                resizeObserver.disconnect();
                chart?.dispose();
            };
        }
    });
</script>

<div bind:this={element} style="width: 100%; height: 100%"></div>
