<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	import { Button, Input, Fileupload, Label, NumberInput, Select, Spinner } from 'flowbite-svelte';
	import { CheckCircle2, XCircle } from 'lucide-svelte';
	
	import { getClientApp } from '$lib/firebase/client';
	
	import FeedbackToast from '$components/feedbacks/FeedbackToast.svelte';
	import type { Ticket } from '$models/ticket';
	import { user } from '$store/store';
	import type { User } from "$lib/auth/user";

	export let data: User;
	if (!$user)
		$user = data;

	// prefisso = FDP24 se 2024, FDP25 se 2025, ecc.
	let prefix = 'FDP'+(new Date().getFullYear()-2000).toString()+'-';
	let suffix = '';
	let startingNumber = 1;
	let codeLength = 4;
	let numberOfCodes = 1250;
	let codes: string[] = [];
	let generativeMode = 'casuale';

	const generateCodes = () => {
		codes = [];
		for (let i = startingNumber; i < startingNumber + numberOfCodes; i++) {
			codes.push(prefix + i?.toString().padStart(codeLength, '0') + suffix);
		}
		return codes;
	};

	const insertCodes = async () => {
		const codes = generateCodes();

		for (let i = 0; i < codes.length; i += 50) {
			const chunk = codes.slice(i, i + 50);
			await fetch('/api/tickets', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({codes: chunk})
			})
				.then((_) => {
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
		}
	};

	let open = false;
	let color: 'green' | 'red' | 'yellow' = 'red';
	let timeOut: NodeJS.Timeout;

	let tickets: Ticket[];

	onMount(async() => {
	});

	$: message = color === 'green' ? 'Codici inseriti nel db con successo' : 'Errore nell\'inserimento dei codici';
	$: icon = color === 'green' ? CheckCircle2 : XCircle;
</script>

<svelte:head>
    <title>Genera</title>
</svelte:head>

<section class="flex h-full w-full flex-col items-center gap-4 flex-grow">
	<div class="flex w-full max-w-96 flex-col items-start gap-4 px-5 pb-12 pt-5 flex-grow">
		{#if $user}
			<h1 class="text-4xl font-bold text-primary-600">Generator</h1>
			<p class="text-justify dark:text-white">
				Attraverso questa pagina è possibile generare ed inserire nel database un numero di biglietti
				desiderato
			</p>

			<main class="w-full text-center">
				<div class="flex gap-8">
					<Label class="flex flex-col items-start py-4">
						Prefisso:
						<Input class="mt-2 text-center" bind:value={prefix} placeholder={'FDP'+(new Date().getFullYear()-2000)?.toString()+'-'} />
					</Label>
					<Label class="flex flex-col items-start py-4">
						Suffisso:
						<Input class="mt-2 text-center" bind:value={suffix} />
					</Label>
				</div>

				<div class="flex gap-8">
					<Label class="flex flex-col items-start gap-4 py-4">
						N° cifre del codice:
						<NumberInput bind:value={codeLength} class=""  />
					</Label>
					<Label class="flex flex-col items-start gap-4 py-4">
						Quantità di codici:
						<NumberInput bind:value={numberOfCodes} class=""  />
					</Label>
					
					<Label class="flex flex-col items-start gap-4 py-4">
						Numero di partenza:
						<NumberInput bind:value={startingNumber} class=""  />
					</Label>
				</div>
				<div class="flex flex-col w-full py-2 gap-3">
					<span class="text-sm rtl:text-right font-medium text-gray-900 dark:text-gray-300">
						Formato codici: <b class="">{prefix}{startingNumber?.toString().padStart(codeLength, '0')}{suffix}</b>
					</span>
					<span class="text-sm rtl:text-right font-medium text-gray-900 dark:text-gray-300">
						Cliccando qui sotto verranno generati e inseriti nel database i codici da
						<span class="text-sm rtl:text-right font-medium text-primary-700 dark:text-primary-300">
							{prefix}{startingNumber?.toString().padStart(codeLength, '0')}{suffix}
						</span> a 
						<span class="text-sm rtl:text-right font-medium text-primary-700 dark:text-primary-300">
							{prefix}{(startingNumber+numberOfCodes-1)?.toString().padStart(codeLength, '0')}{suffix}
						</span>
					</span>
					<Button on:click={insertCodes} class="rounded text-white">Inserisci Codici</Button>
				</div>
				<hr class="border-slate-500 my-3"/>
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