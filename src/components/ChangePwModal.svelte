<script lang="ts">
	import { Button, Helper, Input, Label, Modal, Toast } from "flowbite-svelte";
	import { CheckCircle2, Eye, EyeOff, XCircle } from "lucide-svelte";
	import { user } from "../store/store";
	import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, updatePassword, getAuth } from "firebase/auth";
	import type { FirebaseError } from "firebase/app";

	export let changePwModalOpen: boolean = false;

	let color: 'green' | 'red' = 'green';
	let toastMessage: string = '';
	let error: boolean = false;
	let open: boolean = false;

	let oldPassword: string = '';
	let newPassword: string = '';
	let repeatPassword: string = '';

	let oldPwVisible: boolean = false;
	let pwVisible: boolean = false;
	let validatorError: boolean = true;

	let lessThanEightChars = false;
	let noUpperCase = false;
	let noNumber = false;
	let noSpecialChar = false;

	$: {
		if (validatorError) {
			validatorError = !(newPassword === repeatPassword) ;
		}

		if (lessThanEightChars)
			lessThanEightChars = newPassword.length < 8;

		if (noUpperCase)
			noUpperCase = !/[A-Z]/.test(newPassword);

		if (noNumber)
			noNumber = !/[0-9]/.test(newPassword);

		if (noSpecialChar)
			noSpecialChar = !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(newPassword);		
	}
	$: disableButton = validatorError || (lessThanEightChars || noUpperCase || noNumber || noSpecialChar);

	async function passwordReset(){
		if(newPassword === oldPassword){
			color = 'red';
			toastMessage = 'Le password sono uguali';
			open = true;
			error = true;
			const timeOut = setTimeout(() => {
				open = false;
				clearTimeout(timeOut);
			}, 3500);
			return;
		}

		try{
			const credential = EmailAuthProvider.credential($user!.email!, oldPassword);

			await reauthenticateWithCredential($user!, credential);
			await updatePassword($user!, newPassword);

			await signInWithEmailAndPassword(getAuth(), $user!.email!, newPassword);

			oldPassword = '';
			newPassword = '';
			repeatPassword = '';

			color = 'green';
			toastMessage = 'Password cambiata con successo';
			open = true;
			const timeOut = setTimeout(() => {
				open = false;
				clearTimeout(timeOut);
			}, 3500);
		}
		catch(e){
			color = 'red';
			toastMessage = (e as FirebaseError).message;
			open = true;
			error = true;
			const timeOut = setTimeout(() => {
				open = false;
				clearTimeout(timeOut);
			}, 3500);
		}
	}
</script>

<Modal outsideclose autoclose title="Cambia password" size="sm" bind:open={changePwModalOpen} on:close={() => changePwModalOpen = false} class="z-50">
	<div class="w-full flex flex-col gap-5 items-center justify-center">
		<Label class="w-full">
			Vecchia Password
			<Input
				name="oldPassword"
				type={oldPwVisible ? 'text' : 'password'}
				bind:value={oldPassword}
				class="mt-2"
			>
				<button
					type="button"
					slot="right"
					class="flex items-center justify-center"
					tabindex="-1"
					on:click={() => (oldPwVisible = !oldPwVisible)}
				>
					{#if oldPwVisible}
						<EyeOff />
					{:else}
						<Eye />
					{/if}
				</button>
			</Input>
		</Label>

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
					noSpecialChar = !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(newPassword)
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
				<Helper class="mt-1 flex items-center gap-1" color='gray'>
					<svelte:component this={lessThanEightChars ? XCircle : CheckCircle2} class="w-3 h-3"/>
					La password deve contenere almeno 8 caratteri
				</Helper>
			{/if}
			{#if noUpperCase}
				<Helper class="mt-1 flex items-center gap-1" color='gray'>
					<svelte:component this={noUpperCase ? XCircle : CheckCircle2} class="w-3 h-3"/>
					La password deve contenere almeno una lettera maiuscola
				</Helper>
			{/if}
			{#if noNumber}
				<Helper class="mt-1 flex items-center gap-1" color='gray'>
					<svelte:component this={noNumber ? XCircle : CheckCircle2} class="w-3 h-3"/>
					La password deve contenere almeno un numero
				</Helper>
			{/if}
			{#if noSpecialChar}
				<Helper class="mt-1 flex items-center gap-1" color='gray'>
					<svelte:component this={noSpecialChar ? XCircle : CheckCircle2} class="w-3 h-3"/>
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
				<Helper class="mt-1 flex items-center gap-1" color='gray'>
					<svelte:component this={validatorError ? XCircle : CheckCircle2} class="w-3 h-3"/>
					Le password non corrispondono
				</Helper>
			{/if}
		</Label>
	</div>
	<svelte:fragment slot="footer">
		<Button on:click={passwordReset} disabled={disableButton}>
			Conferma
		</Button>
		<Button color="alternative" on:click={() => changePwModalOpen = false}>
			Annulla
		</Button>
	</svelte:fragment>
</Modal>

<Toast on:close={() => open = false} bind:open color={color} class="w-max mt-10 mb-5 mx-auto right-0 left-0 fixed top-20" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<svelte:component this={error ? XCircle : CheckCircle2} class="w-6 h-6  text-{color}-400" slot="icon"/>
	<span class={`text-${color}-400 font-semibold`}>{toastMessage}</span>
</Toast>