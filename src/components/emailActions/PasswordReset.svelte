<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Helper, Input, Label, Toast, Button } from 'flowbite-svelte';
	import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-svelte';
	import { EmailAuthProvider, confirmPasswordReset, getAuth, signInWithCredential } from 'firebase/auth';
	import type { ActionData } from '../../models/email_action_data';

	export let data: ActionData;

	let timer = 15;
	let startRedirect = false;

	onMount(() => {
		if (data.status !== 200) {
			startRedirect = true;
			const interval = setInterval(() => {
				timer--;
				if (timer === 0) {
					clearInterval(interval);
					goto(data.url || '/');
				}
			}, 1000);
		}
	});

	let color: 'green' | 'red' = 'green';
	let toastMessage: string = '';
	let error: boolean = false;
	let open: boolean = false;

	let newPassword: string = '';
	let repeatPassword: string = '';

	let pwVisible: boolean = false;
	let validatorError: boolean = true;

	let lessThanEightChars = false;
	let noUpperCase = false;
	let noNumber = false;
	let noSpecialChar = false;

	$: {
		if (validatorError) {
			validatorError = !(newPassword === repeatPassword);
		}

		if (lessThanEightChars) lessThanEightChars = newPassword.length < 8;

		if (noUpperCase) noUpperCase = !/[A-Z]/.test(newPassword);

		if (noNumber) noNumber = !/[0-9]/.test(newPassword);

		if (noSpecialChar) noSpecialChar = !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(newPassword);
	}

	$: disableButton = validatorError || (lessThanEightChars || noUpperCase || noNumber || noSpecialChar);

	async function handlePasswordReset() {
		try{
			await confirmPasswordReset(getAuth(), data.actionCode!, newPassword)

			const credential = EmailAuthProvider.credential(data.email!, newPassword);
			await signInWithCredential(getAuth(), credential);

			color = 'green';
			toastMessage = 'Password cambiata';
			open = true;
			startRedirect = true;
			const interval = setInterval(() => {
				timer--;
				if (timer === 0) {
					clearInterval(interval);
					goto(data.url || '/');
				}
			}, 1000);
		}
		catch (error) {
			color = 'red';
			toastMessage = 'Errore';
			error = true;
			open = true;
		}
	}
</script>

{#if data.status === 401}
	<h1 class="text-3xl font-bold text-primary-600">Link non valido</h1>
	<p class="text-left dark:text-white">
		Attenzione! Il link non è valido oppure è scaduto. Chiedi un nuovo link di reset password
	</p>
{:else if data.status === 500}
	<h1 class="text-3xl font-bold text-primary-600">Errore</h1>
	<p class="text-left dark:text-white">
		È stato riscontrato un problema non conosciuto. Riprova più tardi oppure ottieni un altro
		link di reset password. È consigliato fare una segnalazione ad un amministratore.
	</p>
{:else if data.status === 200 && !startRedirect}
	<h1 class="text-3xl font-bold text-primary-600">Reset Password</h1>
	<p class="text-left dark:text-white">
		Stai per reimpostare la password per l'email <b class="text-primary-300">{data.email}</b>
	</p>
	<div class="flex w-full flex-col items-center justify-center gap-5">
		<Label class="w-full">
			Password
			<Input
				name="password"
				type={pwVisible ? 'text' : 'password'}
				bind:value={newPassword}
				on:blur={() => {
					lessThanEightChars = newPassword.length < 8;
					noUpperCase = !/[A-Z]/.test(newPassword);
					noNumber = !/[0-9]/.test(newPassword);
					noSpecialChar = !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(newPassword);
				}}
				class="mt-2"
			>
				<button
					type="button"
					slot="right"
					class="flex items-center justify-center"
					tabindex="-1"
					on:click={() => (pwVisible = !pwVisible)}
				>
					{#if pwVisible}
						<EyeOff />
					{:else}
						<Eye />
					{/if}
				</button>
			</Input>
			{#if lessThanEightChars}
				<Helper class="mt-1 flex items-center gap-1" color="gray">
					<svelte:component
						this={lessThanEightChars ? XCircle : CheckCircle2}
						class="h-3 w-3"
					/>
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
		</Label>

		<Label class="w-full">
			Conferma password
			<Input
				name="repeatPassword"
				type={pwVisible ? 'text' : 'password'}
				color={!validatorError ? 'base' : 'red'}
				bind:value={repeatPassword}
				on:blur={() => (validatorError = !(newPassword === repeatPassword))}
				class="mt-2"
			>
				<button
					type="button"
					slot="right"
					class="flex items-center justify-center"
					tabindex="-1"
					on:click={() => (pwVisible = !pwVisible)}
				>
					{#if pwVisible}
						<EyeOff />
					{:else}
						<Eye />
					{/if}
				</button>
			</Input>
			{#if validatorError}
				<Helper class="mt-1 flex items-center gap-1" color="gray">
					<svelte:component this={validatorError ? XCircle : CheckCircle2} class="h-3 w-3" />
					Le password non corrispondono
				</Helper>
			{/if}
		</Label>

		<Button class="mt-5 w-full" on:click={handlePasswordReset} bind:disabled={disableButton}>Cambia Password</Button>
	</div>
{/if}
{#if startRedirect}
	<p class="text-left dark:text-white">
		Verrai reindirizzato alla home tra <b class="text-lg text-primary-300">{timer}</b>
		secondi.<br />Se non vieni reindirizzato o non vuoi aspettare clicca
		<a href="/" class="text-primary-600">qui</a>
	</p>
{/if}

<Toast
	on:close={() => (open = false)}
	bind:open
	{color}
	class="fixed bottom-5 left-0 right-0 mx-auto mb-5 mt-10 w-max"
	divClass="w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3"
>
	<svelte:component
		this={error ? XCircle : CheckCircle2}
		class="h-6 w-6  text-{color}-400"
		slot="icon"
	/>
	<span class={`text-${color}-400 font-semibold`}>{toastMessage}</span>
</Toast>
