<script lang="ts">
    import { theme } from "$store/store";
    import { onMount } from "svelte";
    import "../app.pcss";
    import NavBar from "../components/NavBar.svelte";
    import type { LayoutProps } from "./$types";
    import { page } from "$app/state";

    let { children }: LayoutProps = $props();

    onMount(() => {
        if (!localStorage.getItem("color-theme"))
            localStorage.setItem("color-theme", "dark");

        $theme = localStorage.getItem("color-theme") as "light" | "dark";
    });

    const noNavbarRoutes = [
        "/(kitchen)/(receive)/kitchen-stats",
    ]
</script>

<div
    class="min-h-[100svh] dark:bg-neutral-800 dark:text-neutral-400 flex flex-col"
>
    {#if !noNavbarRoutes.includes(page.route.id!!)}
        <NavBar />
    {/if}
    {@render children?.()}
</div>
