<script lang="ts">
	import { enhance } from '$app/forms';

	import { Button, Card, Fileupload, Input, Label, NumberInput, Spinner } from 'flowbite-svelte';
	import { CheckCircle2, XCircle } from 'lucide-svelte';

	import FeedbackToast from '$components/feedbacks/FeedbackToast.svelte';
	import type { User } from '$lib/auth/user';
	import { user } from '$store/store';

	export let data: User;
	if (!$user) $user = data;

	// prefisso = FDP24 se 2024, FDP25 se 2025, ecc.
	let prefix = 'FDP' + (new Date().getFullYear() - 2000).toString() + '-';
	let suffix = '';
	let startingNumber = 1;
	let codeLength = 4;
	let numberOfCodes = 1250;
	let codes: string[] = [];

	const insertCodes = async () => {
		codes = [];
		for (let i = startingNumber; i < startingNumber + numberOfCodes; i++) {
			codes.push(prefix + i?.toString().padStart(codeLength, '0') + suffix);
		}

		for (let i = 0; i < codes.length; i += 50) {
			const chunk = codes.slice(i, i + 50);
			const res = await fetch('/api/tickets', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ codes: chunk })
			});

			if (res.ok) {
				error = false;
				color = 'green';
			} else {
				error = true;
				color = 'red';
			}
			message = (await res.json()).message;
			open = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				open = false;
				clearTimeout(timeOut);
			}, 3500);
		}
	};

	let ticketsNumber = 1250;
	let ticketsPerBlock = 50;
	let startCode = 45151;
	$: isNotDivisibile = ticketsNumber % ticketsPerBlock != 0;

	const insertBlocks = async () => {
		const res = await fetch('/api/tickets/blocks', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ ticketsNumber, ticketsPerBlock, startCode })
		});
		if (res.ok) {
			error = false;
			color = 'green';
		} else {
			error = true;
			color = 'red';
		}
		message = (await res.json()).message;
		open = true;
		clearTimeout(timeOut);
		timeOut = setTimeout(() => {
			open = false;
			clearTimeout(timeOut);
		}, 3500);
	};

	let open = false;
	let color: 'green' | 'red' | 'yellow' = 'red';
	let timeOut: NodeJS.Timeout;
	let message = '';
	let error = false;
	$: icon = error ? XCircle : CheckCircle2;
</script>

<svelte:head>
	<title>Genera</title>
</svelte:head>

{#if $user}
	<section class="flex h-full w-full flex-grow flex-wrap items-start justify-center gap-4 py-6">
		<Card padding="md">
			<div class="flex w-full max-w-96 flex-grow flex-col items-start gap-2">
				<h1 class="text-4xl font-bold text-primary-600">Genera Biglietti</h1>
				<p class="text-justify dark:text-white">
					Da questa card puoi generare i biglietti e inserirli nel sistema.
				</p>
				<main class="w-full text-center">
					<div class="flex gap-8">
						<Label class="flex flex-col items-start py-4">
							Prefisso:
							<Input
								class="mt-2 text-center"
								bind:value={prefix}
								placeholder={'FDP' + (new Date().getFullYear() - 2000)?.toString() + '-'}
							/>
						</Label>
						<Label class="flex flex-col items-start py-4">
							Suffisso:
							<Input class="mt-2 text-center" bind:value={suffix} />
						</Label>
					</div>
					<div class="flex gap-8">
						<Label class="flex flex-col items-start gap-4 py-4">
							N° cifre del codice:
							<NumberInput bind:value={codeLength} class="" />
						</Label>
						<Label class="flex flex-col items-start gap-4 py-4">
							Quantità di codici:
							<NumberInput bind:value={numberOfCodes} class="" />
						</Label>
						<Label class="flex flex-col items-start gap-4 py-4">
							Numero di partenza:
							<NumberInput bind:value={startingNumber} class="" />
						</Label>
					</div>
					<div class="flex w-full flex-col gap-3 py-2">
						<span class="text-sm font-medium text-gray-900 dark:text-gray-300 rtl:text-right">
							Formato codici: <b class=""
								>{prefix}{startingNumber?.toString().padStart(codeLength, '0')}{suffix}</b
							>
						</span>
						<span class="text-sm font-medium text-gray-900 dark:text-gray-300 rtl:text-right">
							Cliccando qui sotto verranno generati e inseriti nel database i codici da
							<span
								class="text-sm font-medium text-primary-700 dark:text-primary-300 rtl:text-right"
							>
								{prefix}{startingNumber?.toString().padStart(codeLength, '0')}{suffix}
							</span>
							a
							<span
								class="text-sm font-medium text-primary-700 dark:text-primary-300 rtl:text-right"
							>
								{prefix}{(startingNumber + numberOfCodes - 1)
									?.toString()
									.padStart(codeLength, '0')}{suffix}
							</span>
						</span>
						<Button on:click={insertCodes} class="rounded text-white">Inserisci Codici</Button>
					</div>
				</main>
			</div>
		</Card>
		<Card>
			<div class="flex w-full max-w-96 flex-grow flex-col items-start gap-2">
				<h1 class="text-4xl font-bold text-primary-600">Inserisci da file</h1>
				<p class="text-justify dark:text-white">
					Da questa card puoi inserire un CSV che contiene un codice per riga se il generatore non
					soddisfa i requisiti.
				</p>
				<form
					method="post"
					use:enhance
					enctype="multipart/form-data"
					class="flex w-full flex-col gap-4"
				>
					<Fileupload name="fileToUpload" class="mt-4 w-full" accept=".csv" />
					<Button type="submit">Inserisci Codici da file</Button>
				</form>
			</div>
		</Card>
		<Card padding="md">
			<div class="flex w-full max-w-96 flex-grow flex-col items-start gap-2">
				<h1 class="text-4xl font-bold text-primary-600">Genera Blocchetti</h1>
				<p class="text-justify dark:text-white">
					Da questa card puoi generare i blocchi di biglietti da assegnare ai venditori.<br /><br />
					<b class="text-primary-300">Attenzione:</b> i blocchetti già presenti nel database verranno
					cancellati e sostituiti con i nuovi.
				</p>
				<main class="w-full text-center">
					<div class="flex gap-8">
						<Label class="flex flex-col items-start gap-4 py-4">
							N° biglietti già inseriti:
							<NumberInput bind:value={ticketsNumber} class="" />
						</Label>
						<Label class="flex flex-col items-start gap-4 py-4">
							N° biglietti per blocco:
							<NumberInput bind:value={ticketsPerBlock} class="" />
						</Label>
						<Label class="flex flex-col items-start gap-4 py-4">
							Codice di partenza:
							<NumberInput bind:value={startCode} class="" />
						</Label>
					</div>
					<div class="flex w-full flex-col gap-3 py-2">
						{#if isNotDivisibile}
							<span class="text-sm"
								><b class="text-primary-300">{ticketsNumber}</b> non è divisibile per
								<b class="text-primary-300">{ticketsPerBlock}</b>
							</span>
						{:else}
							<span class="text-sm"
								>Verranno generati <b class="text-primary-300">{ticketsNumber / ticketsPerBlock}</b>
								blocchetti da <b class="text-primary-300">{ticketsPerBlock}</b> biglietti</span
							>
						{/if}
						<Button
							on:click={insertBlocks}
							class="rounded text-white"
							bind:disabled={isNotDivisibile}>Genera Blocchetti</Button
						>
					</div>
				</main>
			</div>
		</Card>
	</section>
{:else}
	<div class="mt-10 flex w-full flex-grow flex-col items-center justify-center gap-5">
		<Spinner size="sm" class="max-w-12 self-center" />
		<span class="text-2xl font-semibold text-primary-600">Attendere...</span>
	</div>
{/if}

<FeedbackToast bind:open bind:color bind:message bind:icon />
