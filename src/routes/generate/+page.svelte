<script lang="ts">
	import { onMount } from 'svelte';
	import { handleSignOut, user } from '../../store/store';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';
	import type { Ticket } from '../../models/ticket';
	import { Card } from 'flowbite-svelte';
	import { Select, Label, Checkbox, Input, Button, Toast } from 'flowbite-svelte';
	import { CheckCircleSolid, CloseCircleSolid } from 'flowbite-svelte-icons';

	import axios from 'axios';

	const codeTypesList = [
		{ value: 'numeric', name: 'Numerico' },
		{ value: 'uppercase', name: 'Maiuscolo' },
		{ value: 'lowercase', name: 'Minuscolo' },
		{ value: 'alphanumeric', name: 'Alfanumerico' }
	];
	let codeType = 'numeric';
	let includeSpecialChars = false;
	let codeLength = 8; /* Lunghezza predefinita dei codici */
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
		let prefix = 'FDP_';
		let counter = 1;

		while (uniqueCodes.size < numberOfCodes) {
			const paddedCounter = counter.toString().padStart(4, '0');
			const code = prefix + paddedCounter;

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
		await axios
			.post('/api/tickets', codes)
			.then((res) => {
				color = 'green';
				trigger();
			})
			.catch((err) => {
				color = 'red';
				trigger();
				console.log(err);
			});
	};

	let open = false;
	let counter = 4;
	let color: 'green' | 'red' | 'yellow' = 'red';

	const trigger = () => {
		open = true;
		counter = 6;
		timeout();
	};

	const timeout = (): any => {
		if (--counter > 0) return setTimeout(timeout, 1000);
		open = false;
	};

	let tickets: Ticket[];

	onMount(async () => {
		const res = await fetch('/api/tickets');
		tickets = (await res.json()).body.tickets;
		codesInDB = new Set<string>(tickets.map((ticket) => ticket.ticketID));
	});

	// const auth = getAuth();

	// onAuthStateChanged(auth, (newUser) => {
	//   $user = newUser;
	// });
</script>

<section class="flex h-full w-full flex-col items-center gap-4">
	<div class="flex w-full max-w-96 flex-col items-start gap-4 px-5 pb-12 pt-5">
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
				<Input type="number" bind:value={codeLength} />
			</Label>

			<Label for="first_name" class="flex items-start gap-4 py-4">
				Quantità di codici:
				<Input type="number" bind:value={numberOfCodes} />
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
		</main>
	</div>
</section>

<Toast
	{color}
	bind:open
	class="absolute bottom-5 left-0 right-0 mx-auto w-max"
	divClass="w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3"
>
	<svelte:fragment slot="icon">
		{#if color == 'green'}
			<CheckCircleSolid class="h-5 w-5" />
			<span class="sr-only">Check icon</span>
		{:else}
			<CloseCircleSolid class="h-5 w-5" />
			<span class="sr-only">Error icon</span>
		{/if}
	</svelte:fragment>
	{#if color == 'green'}
		Codici inseriti nel db con successo
	{:else}
		Errore nell'inserimento dei codici
	{/if}
</Toast>