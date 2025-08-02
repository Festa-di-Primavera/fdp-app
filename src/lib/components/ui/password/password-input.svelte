<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { cn } from "$lib/ui-utils";
    import { box, mergeProps } from "svelte-toolbelt";
    import { usePasswordInput } from "./password.svelte.js";
    import type { PasswordInputProps } from "./types.js";

    let {
        ref = $bindable(null),
        value = $bindable(""),
        class: className,
        children,
        ...rest
    }: PasswordInputProps = $props();

    const state = usePasswordInput({
        value: box.with(
            () => value,
            (v) => (value = v)
        ),
        ref: box.with(() => ref),
    });

    const mergedProps = $derived(mergeProps(rest, state.props));
</script>

<div class="relative">
    <Input
        {...mergedProps}
        bind:value
        bind:ref
        type={state.root.opts.hidden.current ? "password" : "text"}
        class={cn("transition-all", className)}
    />
    {@render children?.()}
</div>
