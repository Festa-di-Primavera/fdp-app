<script lang="ts">
    import { Helper } from "flowbite-svelte";
    import { XCircle } from "lucide-svelte";

    interface Props {
        option: "login" | "register" | "recover";
        lessThanEightChars: boolean;
        noUpperCase: boolean;
        noNumber: boolean;
        noSpecialChar: boolean;
    }

    let {
        option = $bindable(),
        lessThanEightChars = $bindable(),
        noUpperCase = $bindable(),
        noNumber = $bindable(),
        noSpecialChar = $bindable(),
    }: Props = $props();
</script>

{#if option === "register"}
    {#if lessThanEightChars}
        <Helper class="mt-1 flex items-center gap-1" color="gray">
            <XCircle class="h-3 w-3" />
            La password deve contenere almeno 8 caratteri
        </Helper>
    {/if}
    {#if noUpperCase}
        <Helper class="mt-1 flex items-center gap-1" color="gray">
            <XCircle class="h-3 w-3" />
            La password deve contenere almeno una lettera maiuscola
        </Helper>
    {/if}
    {#if noNumber}
        <Helper class="mt-1 flex items-center gap-1" color="gray">
            <XCircle class="h-3 w-3" />
            La password deve contenere almeno un numero
        </Helper>
    {/if}
    {#if noSpecialChar}
        <Helper class="mt-1 flex items-center gap-1" color="gray">
            <XCircle class="h-3 w-3" />
            La password deve contenere almeno un carattere speciale
        </Helper>
    {/if}
{/if}
