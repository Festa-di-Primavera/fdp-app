<script lang="ts">
	import { Helper } from "flowbite-svelte";
	import { CheckCircle2, XCircle } from "lucide-svelte";

	export let option: 'login' | 'register' | 'recover';
	export let lessThanEightChars: boolean;
	export let noUpperCase: boolean;
	export let noNumber: boolean;
	export let noSpecialChar: boolean;
</script>

{#if option === 'register'}
	{#if lessThanEightChars}
		<Helper class="mt-1 flex items-center gap-1" color="gray">
			<svelte:component this={lessThanEightChars ? XCircle : CheckCircle2} class="h-3 w-3" />
			La password deve contenere almeno 8 caratteri
		</Helper>
	{/if}
	{#if noUpperCase}
		<Helper class="mt-1 flex items-center gap-1" color="gray">
			<svelte:component this={noUpperCase ? XCircle : CheckCircle2} class="h-3 w-3" />
			La password deve contenere almeno una lettera maiuscola
		</Helper>
	{/if}
	{#if noNumber}
		<Helper class="mt-1 flex items-center gap-1" color="gray">
			<svelte:component this={noNumber ? XCircle : CheckCircle2} class="h-3 w-3" />
			La password deve contenere almeno un numero
		</Helper>
	{/if}
	{#if noSpecialChar}
		<Helper class="mt-1 flex items-center gap-1" color="gray">
			<svelte:component this={noSpecialChar ? XCircle : CheckCircle2} class="h-3 w-3" />
			La password deve contenere almeno un carattere speciale
		</Helper>
	{/if}
{/if}
