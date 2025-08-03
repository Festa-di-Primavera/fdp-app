<script lang="ts">
    import { cn, type WithElementRef } from "$lib/ui-utils.js";
    import type {
        HTMLInputAttributes,
        HTMLInputTypeAttribute,
    } from "svelte/elements";

    type InputType = Exclude<HTMLInputTypeAttribute, "file">;

    type Props = WithElementRef<
        Omit<HTMLInputAttributes, "type"> &
            (
                | { type: "file"; files?: FileList }
                | { type?: InputType; files?: undefined }
            )
    >;

    let {
        ref = $bindable(null),
        value = $bindable(),
        type,
        files = $bindable(),
        class: className,
        ...restProps
    }: Props = $props();
</script>

{#if type === "file"}
    <input
        bind:this={ref}
        data-slot="input"
        class={cn(
            "selection:bg-primary dark:bg-input/30 selection:text-primary-foreground border-input ring-offset-background placeholder:text-muted-foreground shadow-xs flex h-9 w-full min-w-0 rounded-md border bg-transparent text-sm font-medium outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm cursor-pointer",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] mt-1",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            // Stili per il pulsante "Scegli file"
            "file:mr-3 file:py-2 file:px-3 file:rounded-l-md file:rounded-r-none file:border-0 file:text-sm file:font-medium file:cursor-pointer",
            // Tema chiaro: pulsante nero con testo bianco
            "file:bg-neutral-800 file:text-white",
            // Tema scuro: pulsante bianco con testo nero
            "dark:file:bg-neutral-200 dark:file:text-black dark:file:border-r-border",
            className
        )}
        type="file"
        bind:files
        bind:value
        {...restProps}
    />
{:else}
    <input
        bind:this={ref}
        data-slot="input"
        class={cn(
            "border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground shadow-xs flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] mt-1",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className
        )}
        {type}
        bind:value
        {...restProps}
    />
{/if}
