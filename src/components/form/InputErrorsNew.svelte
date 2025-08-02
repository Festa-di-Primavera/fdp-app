<script lang="ts">
	import { Helper } from "$lib/components/ui/password/index";

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
	<Helper enabled={lessThanEightChars}>
		La password deve contenere almeno 8 caratteri
	</Helper>

	<Helper enabled={noUpperCase}>
		La password deve contenere almeno una lettera maiuscola
	</Helper>

	<Helper enabled={noNumber}>
		La password deve contenere almeno un numero
	</Helper>

	<Helper enabled={noSpecialChar}>
		La password deve contenere almeno un carattere speciale
	</Helper>
{/if}
