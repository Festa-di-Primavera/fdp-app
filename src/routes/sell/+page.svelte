<script lang="ts">
	import { Button, Label, Input, Spinner, Toast } from "flowbite-svelte"
	import { getAuth, signInWithCustomToken } from "firebase/auth";
	import { Ticket, XCircle } from 'lucide-svelte';
	import { onMount } from "svelte";

	import { getClientApp } from "$lib/firebase/client";

	import { enhance } from "$app/forms";
	
	import { user } from "../../store/store";
	import QrReader from "../../components/QrReader.svelte";

	export let data: {token: string};
	let ticketCode: string;

	let toastOpen: boolean = false;
	let toastMessage: string = '';

	onMount(async() => {
		if(getAuth(getClientApp()).currentUser === null){
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
			});
		}
	});
</script>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
	<div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow">
		{#if $user}
			<h1 class="text-primary-600 font-bold text-4xl">Vendi</h1>
			<p class="dark:text-white text-justify">Inserire nome, cognome e, scansionando il QR, il codice del biglietto.</p>
			<form method="post" class="flex flex-col gap-4 w-full" use:enhance>
				<Label class="text-black dark:text-white font-medium text-md">
					Nome <span class="text-primary-700">*</span>
					<Input required class="mt-1" name="name" autocomplete="off"/>
				</Label>
				<Label class="text-black dark:text-white font-medium text-md">
					Cognome <span class="text-primary-700">*</span>
					<Input required class="mt-1" name="surname" autocomplete="off"/>
				</Label>
				<Label class="text-black dark:text-white font-medium text-md">
					Codice Biglietto <span class="text-primary-700">*</span>
					<Input required class="mt-1" bind:value={ticketCode} name="code" autocomplete="off">
						<Ticket slot="left" class="w-6 h-6 text-primary-600 dark:text-white"/>
					</Input>
				</Label>

				<Input name="user" type="hidden" value={$user?.uid}/>

				<div class="w-full mt-6 flex items-center justify-center">
					<QrReader bind:codeResult={ticketCode}/>
				</div>
				<Button class="w-full mt-6" type="submit">Vendi</Button>
			</form>
		{:else}
            <div class="w-full flex flex-col flex-grow gap-5 items-center justify-center mt-10">
                <Spinner size="sm" class="max-w-12 self-center"/>
                <span class="text-primary-600 font-semibold text-2xl">Attendere...</span>
            </div>
        {/if}
	</div>
</section>

<Toast bind:open={toastOpen} color="red" class="w-max mt-10 mb-5 mx-auto right-0 left-0 fixed bottom-5" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<XCircle class="w-6 h-6  text-red-400" slot="icon"/>
	<span class='text-red-400 font-semibold'>{toastMessage}</span>
</Toast>
