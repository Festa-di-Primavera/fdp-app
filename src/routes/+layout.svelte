<script lang="ts">
    import { theme } from "$store/store";
    import { onMount } from "svelte";
    import "../app.pcss";
    import NavBar from "../components/NavBar.svelte";
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();

    onMount(() => {
        if (!localStorage.getItem("color-theme"))
            localStorage.setItem("color-theme", "dark");

        $theme = localStorage.getItem("color-theme") as "light" | "dark";
    });
</script>

<div class="min-h-[100svh] dark:bg-neutral-800 dark:text-neutral-400 flex flex-col">
    <NavBar />
    {@render children?.()}
</div>
