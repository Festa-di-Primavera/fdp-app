<!-- /routes/login/password/[token] -->

<!-- display token -->
<script lang="ts">
	import { page } from '$app/stores';
	import { Button, Helper, Input, Label } from 'flowbite-svelte';
	import { CheckCircle2, EyeOff, XCircle } from 'lucide-svelte';
	import PasswordEye from '$components/form/PasswordEye.svelte';
	import { enhance } from '$app/forms';
	import FeedbackToast from '$components/feedbacks/FeedbackToast.svelte';

	let feedbackToastOpen: boolean = false;
	let color: 'green' | 'red' | 'yellow' = 'green';
	let timeOut: NodeJS.Timeout;
	let toastMessage: string = '';

	export let form;
	$: if (form && form.error) {
		color = 'red';
		toastMessage = form.message;
		feedbackToastOpen = true;
		timeOut = setTimeout(() => {
			feedbackToastOpen = false;
			clearTimeout(timeOut);
		}, 3500);
	}

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
	$: disableButton = newPassword == '' || repeatPassword == '' || validatorError || lessThanEightChars || noUpperCase || noNumber || noSpecialChar;
</script>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
    <div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow">
		<h1 class="text-primary-600 font-bold text-4xl">Reset Password</h1>
		<p class="dark:text-white text-justify">
			Inserisci la nuova password per fare il reset
		</p>
		<form use:enhance action="?/passwordReset" method="post" class="w-full flex flex-col gap-2 items-center">
			<Label class="w-full">
				Password
				<Input
					name="password"
					autocomplete="off"
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
					<PasswordEye bind:pwVisible slot="right" />
				</Input>
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
			</Label>

			<Label class="w-full">
				Conferma password
				<Input
					name="password_repeat"
					autocomplete="off"
					type={pwVisible ? 'text' : 'password'}
					color={!validatorError ? 'base' : 'red'}
					bind:value={repeatPassword}
					on:blur={() => (validatorError = !(newPassword === repeatPassword))}
					class="mt-2"
				>
					<PasswordEye bind:pwVisible slot="right" />
				</Input>
				{#if validatorError}
					<Helper class="mt-1 flex items-center gap-1" color="gray">
						<svelte:component this={validatorError ? XCircle : CheckCircle2} class="h-3 w-3" />
						Le password non corrispondono
					</Helper>
				{/if}
			</Label>
			<input type="hidden" name="token" value={$page.params.token} />

			<Button class="mt-5 w-[90%]" type="submit" bind:disabled={disableButton}>
				Resetta password
			</Button>
		</form>
	</div>
</section>

<FeedbackToast
	bind:open={feedbackToastOpen}
	bind:color
	bind:message={toastMessage}
	icon={XCircle}
/>
