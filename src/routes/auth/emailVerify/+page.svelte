<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	export let data: { status: number; url?: string };

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

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
	<div class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5">
		{#if data.status === 200}
			<h1 class="text-3xl font-bold text-primary-600">Email Verificata</h1>
			<p class="text-left dark:text-white">
				Bene! Ora puoi accedere alle funzionalità dell'app in base al tuo ruolo. Per cambiare il tuo
				ruolo contatta un amministratore.
			</p>
		{:else if data.status === 401}
			<h1 class="text-3xl font-bold text-primary-600">Link non valido</h1>
			<p class="text-left dark:text-white">
				Attenzione! Il link non è valido oppure è scaduto. Per ottenere un altro link di verifica,
				clicca sul pulsante presente nella homepage dopo aver fatto il login.
			</p>
		{:else}
			<h1 class="text-3xl font-bold text-primary-600">Errore</h1>
			<p class="text-left dark:text-white">
				È stato riscontrato un problema non conosciuto. Riprova più tardi oppure ottieni un altro
				link di verifica, cliccando sul pulsante presente nella homepage dopo aver fatto il login. È
				consigliato fare una segnalazione ad un amministratore.
			</p>
		{/if}
		<p class="text-left dark:text-white">
			Verrai reindirizzato alla home tra <b class="text-lg text-primary-300">{timer}</b> secondi.<br
			/>Se non vieni reindirizzato o non vuoi aspettare clicca
			<a href="/" class="text-primary-600">qui</a>
		</p>
	</div>
</section>
