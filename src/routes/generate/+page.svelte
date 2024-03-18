<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';

	import { getAuth, signInWithCustomToken } from 'firebase/auth';
	import { XCircle, CheckCircle2, icons } from 'lucide-svelte';
	import { Select, Label, Checkbox, Button, Toast, NumberInput, Spinner, Input, Fileupload } from 'flowbite-svelte';
	
	import { getClientApp, handleSignOut } from '$lib/firebase/client';
	
	import { user } from '../../store/store';
	import type { Ticket } from '../../models/ticket';
	import SignInToast from '../../components/feedbacks/SignInToast.svelte';
	import FeedbackToast from '../../components/feedbacks/FeedbackToast.svelte';

	export let data: {logout?: boolean, token?: string };

	const codeTypesList = [
		{ value: 'numeric', name: 'Numerico' },
		{ value: 'uppercase', name: 'Maiuscolo' },
		{ value: 'lowercase', name: 'Minuscolo' },
		{ value: 'alphanumeric', name: 'Alfanumerico' }
	];
	let codeType = 'numeric';
	let includeSpecialChars = false;
	let codeLength = 4;
	let numberOfCodes = 10;
	let codes: string[] = [];
	let codesInDB: Set<string>;
	let generativeMode = 'casuale';

	const generateCodes = () => {
		const characters = getCharacters();
		const uniqueCodes = new Set<string>();

		if (generativeMode === 'casuale') {
			generateRandomCodes(uniqueCodes, characters);
		} else if (generativeMode === 'progressiva') {
			generateProgressiveCodes(uniqueCodes);
		}

		codes = Array.from(uniqueCodes);
	};

	const generateRandomCodes = (uniqueCodes: Set<string>, characters: string) => {
		while (uniqueCodes.size < numberOfCodes) {
			let code = '';

			for (let j = 0; j < codeLength; j++) {
				const randomIndex = Math.floor(Math.random() * characters.length);
				code += characters[randomIndex];
			}
			if (!codesInDB.has(code)) {
				uniqueCodes.add(code);
			}
		}
	};

	const generateProgressiveCodes = (uniqueCodes: Set<string>) => {
		let counter = 1;

		while (uniqueCodes.size < numberOfCodes) {
			const code = counter.toString().padStart(codeLength, '0');

			if (!codesInDB.has(code)) {
				uniqueCodes.add(code);
			}

			counter++;
		}
	};

	/* funzione per ottenere il set di caratteri utilizzabili */
	const getCharacters = () => {
		let characters = '';

		if (codeType === 'numeric' || codeType === 'alphanumeric') {
			characters += '0123456789';
		}

		if (codeType === 'uppercase' || codeType === 'alphanumeric') {
			characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		}

		if (codeType === 'lowercase' || codeType === 'alphanumeric') {
			characters += 'abcdefghijklmnopqrstuvwxyz';
		}

		if (includeSpecialChars) {
			characters += '!@#$%^&*()_-+=<>?';
		}

		return characters;
	};

	const insertCodes = async () => {
		await fetch('/api/tickets', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({codes, token: data.token})
		})
			.then((res) => {
				color = 'green';
				open = true;
				clearTimeout(timeOut);
				timeOut = setTimeout(() => {
					open = false;
					clearTimeout(timeOut);
				}, 3500);
			})
			.catch((err) => {
				color = 'red';
				open = true;
				clearTimeout(timeOut);
				timeOut = setTimeout(() => {
					open = false;
					clearTimeout(timeOut);
				}, 3500);
				console.log(err);
			});
	};

	let open = false;
	let color: 'green' | 'red' | 'yellow' = 'red';
	let timeOut: NodeJS.Timeout;

	let signInToastOpen: boolean = false;
	let signInToastMessage: string = '';

	let tickets: Ticket[];

	onMount(async() => {
		if(data.logout){
			handleSignOut(true);
			return;
		}
		const res = await fetch('/api/tickets');
		tickets = (await res.json()).body.tickets;
		codesInDB = new Set<string>(tickets.map((ticket) => ticket.ticketID));

		if(getAuth(getClientApp()).currentUser === null && data.token){
			signInWithCustomToken(getAuth(), data.token).then((userCredential) => {
				$user = userCredential.user;
			}).catch((error) => {
				if(error.code === 'auth/invalid-custom-token'){
					signInToastMessage = 'Token non valido';
				}
				else if(error.code === 'auth/network-request-failed'){
					signInToastMessage = 'Errore di rete';
				}
				else{
					signInToastMessage = 'Errore sconosciuto';
				}
				signInToastOpen = true;
				clearTimeout(timeOut);
				timeOut = setTimeout(() => {
					signInToastOpen = false;
					clearTimeout(timeOut);
				}, 3500);
			});
		}
	});

	$: message = color === 'green' ? 'Codici inseriti nel db con successo' : 'Errore nell\'inserimento dei codici';
	$: icon = color === 'green' ? CheckCircle2 : XCircle;
</script>

<section class="flex h-full w-full flex-col items-center gap-4 flex-grow">
	<div class="flex w-full max-w-96 flex-col items-start gap-4 px-5 pb-12 pt-5 flex-grow">
		{#if $user}
			<h1 class="text-4xl font-bold text-primary-600">Generator</h1>
			<p class="text-justify dark:text-white">
				Attraverso questa pagina è possibile generare ed inserire nel database un numero di biglietti
				desiderato
			</p>

			<main class="w-full text-center">
				<Label class="flex flex-col items-start py-4">
					Tipologia dei codici:
					<Select class="mt-2" items={codeTypesList} bind:value={codeType} placeholder="" />
				</Label>
				<Checkbox bind:checked={includeSpecialChars}>Includi i caratteri speciali</Checkbox>

				<Label for="first_name" class="flex items-start gap-4 py-4">
					Lunghezza dei codici:
					<NumberInput on:blur={() => {if(codeLength < 4) codeLength=4}} min="4" bind:value={codeLength}  />
				</Label>

				<Label for="first_name" class="flex items-start gap-4 py-4">
					Quantità di codici:
					<NumberInput on:blur={() => {if(numberOfCodes > 2000) numberOfCodes=2000}} max="2000" bind:value={numberOfCodes}  />
				</Label>

				<Label class="flex flex-col items-start py-4">
					Modalità di generazione:
					<Select
						class="mt-2"
						items={[
							{ name: 'casuale', value: 'casuale' },
							{ name: 'progressiva', value: 'progressiva' }
						]}
						placeholder=""
						bind:value={generativeMode}
					/>
				</Label>

				<div class="flex w-full justify-between py-2">
					<Button on:click={generateCodes} class="rounded text-white">Genera Codici</Button>
					<Button on:click={insertCodes} class="rounded text-white">Inserisci Codici</Button>
				</div>

				<ul class="mt-4 grid grid-cols-3 gap-2">
					{#each codes as code (code)}
						<li class="rounded border p-2 dark:text-white">{code}</li>
					{/each}
				</ul>

				<form method="post" use:enhance enctype="multipart/form-data" class="flex flex-col gap-4">
					<Fileupload name="fileToUpload" class="mt-4" accept=".csv"/>
					<Button type="submit">Inserisci Codici da file</Button>
				</form>
			</main>
		{:else}
			<div class="w-full flex flex-col flex-grow gap-5 items-center justify-center mt-10">
				<Spinner size="sm" class="max-w-12 self-center"/>
				<span class="text-primary-600 font-semibold text-2xl">Attendere...</span>
			</div>
		{/if}
	</div>
</section>

<FeedbackToast bind:open={open} bind:color bind:message bind:icon/>
<SignInToast bind:open={signInToastOpen} bind:message={signInToastMessage}/>