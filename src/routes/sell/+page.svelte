<script lang="ts">
	import { Button, Input, Label, Modal, Spinner } from "flowbite-svelte";
	import { CheckCircle2, Ticket, XCircle } from 'lucide-svelte';

	import { convertCode } from "$lib/codeConverter";
	import type { User } from "$lib/auth/user";
	import QrReader from "$components/QrReader.svelte";
	import { user } from "$store/store";

	export let data: User;
	if(!$user)
		$user = data;

	let ticketCode: string;

	let modalOpen: boolean = false;
	let modalMessage: string = '';
	let color: 'green' | 'red' = 'green';
	let error: boolean = false;

	let name: string = '';
	let surname: string = '';

	$: disableButton = name === '' || surname === '' || ticketCode === '';

	const onKeyDown = (e: KeyboardEvent) => {
		if(e.key === 'Enter' && name !== '' && surname !== '' && ticketCode !== ''){
			handleSell();
		}
	}

	async function handleSell() {
		disableButton = true;
		if(name !== '' && surname !== '' && ticketCode !== ''){
			name = name.trim().toUpperCase();
			surname = surname.trim().toUpperCase();
			ticketCode = convertCode(ticketCode.trim()) ?? '';

			try{
				let response;
				if(ticketCode !== ''){
					response = await fetch(`/api/tickets/${ticketCode}`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							name,
							surname,
							seller: $user?.id
						})
					});
				}

				if(response?.ok){
					error = false;
					color = 'green';
				}
				else{
					error = true;
					color = 'red';
				}
				
				modalMessage = ticketCode !== '' ? (await response!.json()).message : 'Biglietto non valido';
				modalOpen = true;
			}
			catch(e){
				color = 'red';
				modalMessage = 'Errore di rete';
				error = true;
				modalOpen = true;
			}
		}
		else{
			modalMessage = 'Compilare tutti i campi';
			color = 'red';
			modalOpen = true;
		}
	}

	const closeModal = () => {
		if(!error){
			name = '';
			surname = '';
		}
		ticketCode = '';
		modalOpen = false;
	}
</script>

<svelte:head>
    <title>Vendi</title>
</svelte:head>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
	<div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow">
		{#if $user}
			<h1 class="text-primary-600 font-bold text-4xl">Vendi</h1>
			<p class="dark:text-white text-justify">Inserire nome, cognome e, scansionando il QR, il codice del biglietto.</p>
			
			<Label class="text-black dark:text-white font-medium text-md w-full">
				Nome Ospite <span class="text-primary-700">*</span>
				<Input class="mt-1" bind:value={name} autocomplete="off" on:keypress={onKeyDown}/>
			</Label>
			<Label class="text-black dark:text-white font-medium text-md w-full">
				Cognome Ospite <span class="text-primary-700">*</span>
				<Input class="mt-1" bind:value={surname} autocomplete="off" on:keypress={onKeyDown}/>
			</Label>
			<Label class="text-black dark:text-white font-medium text-md w-full">
				Codice Biglietto <span class="text-primary-700">*</span>
				<Input class="mt-1" bind:value={ticketCode} autocomplete="off" on:keypress={onKeyDown}>
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

<Modal bind:open={modalOpen} on:close={closeModal} size="xs" outsideclose autoclose>
	<span slot="header" class="text-2xl font-semibold text-{color}-500 flex items-center gap-2">
		<svelte:component this={error ? XCircle : CheckCircle2} class="w-6 h-6  text-{color}-500"/>
		{error ? 'Errore' : 'Successo'}
	</span>
	<div class="flex flex-col gap-5">
		<span class="text-xl font-medium text-gray-500">{modalMessage}</span>
		{#if !error}
			<div class="flex flex-col">
				<span class="mb-3">Codice: {ticketCode || ''}</span>
				<span>Nome: {name}</span>
				<span>Cognome: {surname}</span>
			</div>
		{/if}
	</div>
	<Button class="w-full" on:click={closeModal} slot="footer">Chiudi</Button>
</Modal>