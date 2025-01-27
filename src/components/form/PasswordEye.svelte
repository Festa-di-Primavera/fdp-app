<script lang="ts">
    import { Eye, EyeOff } from "lucide-svelte";

    interface Props {
        pwVisible: boolean;
    }

    let { pwVisible = $bindable() }: Props = $props();
</script>

<button
    type="button"
    class="flex items-center justify-center"
    tabindex="-1"
    onclick={() => (pwVisible = !pwVisible)}
>
    {#if pwVisible}
        <EyeOff />
    {:else}
        <Eye />
    {/if}
</button>
