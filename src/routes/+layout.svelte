<script lang="ts">
    import { page } from "$app/state";
    import { Toaster } from "$lib/components/ui/sonner";
    import { ModeWatcher } from "mode-watcher";
    import "../app.css";
    import NavBar from "../components/NavBar.svelte";
    import type { LayoutProps } from "./$types";

    let { children }: LayoutProps = $props();

    const noNavbarRoutes = ["/(kitchen)/(receive)/kitchen-stats"];
</script>

<ModeWatcher />
<div class="min-h-[100svh] flex flex-col">
    {#if !noNavbarRoutes.includes(page.route.id!!)}
        <NavBar />
    {/if}
    <Toaster position="top-center" richColors visibleToasts={1} toastOptions={{
        style: "transform: translateY(+150%);",
    }} />
    {@render children?.()}
</div>
