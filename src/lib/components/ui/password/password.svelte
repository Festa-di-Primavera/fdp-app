<script lang="ts">
    import { box } from "svelte-toolbelt";
    import { usePassword } from "./password.svelte.js";
    import type { PasswordRootProps } from "./types";
    import { cn } from "$lib/ui-utils";

    let {
        ref = $bindable(null),
        hidden = $bindable(true),
        class: className,
        children,
    }: PasswordRootProps = $props();

    usePassword({
        hidden: box.with(
            () => hidden,
            (v) => (hidden = v)
        ),
    });
</script>

<div bind:this={ref} class={cn("flex flex-col gap-1", className)}>
    {@render children?.()}
</div>
