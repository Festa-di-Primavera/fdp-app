<script lang="ts">
	import { Button, Label, Input, Spinner, Toast } from "flowbite-svelte"
	import { getAuth, signInWithCustomToken } from "firebase/auth";
	import { CheckCircle2, Ticket, XCircle } from 'lucide-svelte';
	import { onMount } from "svelte";

	import { getClientApp } from "$lib/firebase/client";

	import { enhance } from "$app/forms";
	
	import { user } from "../../store/store";
	import QrReader from "../../components/QrReader.svelte";

	export let data: {token: string};

	let ticketCode: string;

	let toastOpen: boolean = false;
	let toastMessage: string = '';

	let feedbackToastOpen: boolean = false;
	let message: string = '';
	let color: 'green' | 'red' = 'green';
	let error: boolean = false;

	let name: string = '';
	let surname: string = '';

	$: disableButton = name === '' || surname === '' || ticketCode === '';

	onMount(async() => {
		if(getAuth(getClientApp()).currentUser === null && data.token){
			signInWithCustomToken(getAuth(), data.token).then((userCredential) => {
				$user = userCredential.user;
			}).catch((error) => {
				if(error.code === 'auth/invalid-custom-token'){
					toastMessage = 'Token non valido';
				}
				else if(error.code === 'auth/network-request-failed'){
					toastMessage = 'Errore di rete';
				}
				else{
					toastMessage = 'Errore sconosciuto';
				}
				toastOpen = true;
				const timeOut = setTimeout(() => {
					toastOpen = false;
					clearTimeout(timeOut);
				}, 3500);
			});
		}
	});

	async function handleSell() {
		disableButton = true;
		if(name !== '' && surname !== '' && ticketCode !== ''){
			name = name.trim();
			surname = surname.trim();
			ticketCode = ticketCode.trim();

			try{
				const response = await fetch(`/api/tickets/${ticketCode}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						name,
						surname,
						seller: $user?.uid,
						user: $user?.uid
					})
				});

				if(response.ok){
					error = false;
					color = 'green';
				}
				else{
					error = true;
					color = 'red';
				}
				
				message = (await response.json()).message;
				feedbackToastOpen = true;
				const timeOut = setTimeout(() => {
					feedbackToastOpen = false;
					clearTimeout(timeOut);
				}, 3500);
			}
			catch(e){
				color = 'red';
				message = 'Errore di rete';
				feedbackToastOpen = true;
				error = true;
				const timeOut = setTimeout(() => {
					feedbackToastOpen = false;
					clearTimeout(timeOut);
				}, 3500);
			}
		}
		else{
			message = 'Compilare tutti i campi';
			color = 'red';
			feedbackToastOpen = true;
			const timeOut = setTimeout(() => {
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
		}

		name = '';
		surname = '';
		ticketCode = '';
	}
</script>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
	<div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow">
		{#if $user}
			<h1 class="text-primary-600 font-bold text-4xl">Vendi</h1>
			<p class="dark:text-white text-justify">Inserire nome, cognome e, scansionando il QR, il codice del biglietto.</p>
			
			<Label class="text-black dark:text-white font-medium text-md w-full">
				Nome Ospite <span class="text-primary-700">*</span>
				<Input class="mt-1" bind:value={name} autocomplete="off"/>
			</Label>
			<Label class="text-black dark:text-white font-medium text-md w-full">
				Cognome Ospite <span class="text-primary-700">*</span>
				<Input class="mt-1" bind:value={surname} autocomplete="off"/>
			</Label>
			<Label class="text-black dark:text-white font-medium text-md w-full">
				Codice Biglietto <span class="text-primary-700">*</span>
				<Input class="mt-1" bind:value={ticketCode} autocomplete="off">
					<Ticket slot="left" class="w-6 h-6 text-primary-600 dark:text-white"/>
				</Input>
			</Label>

			<div class="w-full mt-6 flex items-center justify-center">
				<QrReader bind:codeResult={ticketCode}/>
			</div>
			<Button class="w-full mt-6" on:click={handleSell} bind:disabled={disableButton}>Vendi</Button>
		{:else}
            <div class="w-full flex flex-col flex-grow gap-5 items-center justify-center mt-10">
                <Spinner size="sm" class="max-w-12 self-center"/>
                <span class="text-primary-600 font-semibold text-2xl">Attendere...</span>
            </div>
        {/if}
	</div>
</section>

<Toast on:close={() => toastOpen = false} bind:open={toastOpen} color="red" class="w-max mt-10 mb-5 mx-auto right-0 left-0 fixed top-20" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<XCircle class="w-6 h-6  text-red-400" slot="icon"/>
	<span class='text-red-400 font-semibold'>{toastMessage}</span>
</Toast>

<Toast on:close={() => feedbackToastOpen = false} bind:open={feedbackToastOpen} color={color} class="w-max mt-5 mx-auto right-0 left-0 fixed top-20" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<svelte:component this={error ? XCircle : CheckCircle2} class="w-6 h-6  text-{color}-400" slot="icon"/>
	<span class={`text-${color}-400 font-semibold`}>{message}</span>
</Toast>