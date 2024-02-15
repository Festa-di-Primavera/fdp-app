<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { ActionData } from '../../models/email_action_data';

	export let data: ActionData;

	let timer = 15;

	onMount(() => {
		const interval = setInterval(() => {
			timer--;
			if (timer === 0) {
				clearInterval(interval);
				goto(data.url || '/');
			}
		}, 1000);
	});
</script>

{#if data.status === 200}
	<h1 class="text-3xl font-bold text-primary-600">Email Ripristinata</h1>
	<p class="text-left dark:text-white">
		Bene! L'email è stata reimpostata a <b>{data.email}</b>. Per la tua sicurezza ti consigliamo di
		cambiare la password se non sei stato tu a cambiare la prima volta l'email
	</p>
{:else if data.status === 401}
	<h1 class="text-3xl font-bold text-primary-600">Link non valido</h1>
	<p class="text-left dark:text-white">
		Attenzione! Il link non è valido oppure è scaduto. Contatta un amministratore dell'app
	</p>
{:else}
	<h1 class="text-3xl font-bold text-primary-600">Errore</h1>
	<p class="text-left dark:text-white">
		È stato riscontrato un problema non conosciuto. È consigliato fare una segnalazione ad un amministratore.
	</p>
{/if}
<p class="text-left dark:text-white">
	Verrai reindirizzato alla home tra <b class="text-lg text-primary-300">{timer}</b> secondi.<br
	/>Se non vieni reindirizzato o non vuoi aspettare clicca
	<a href="/" class="text-primary-600">qui</a>
</p>
