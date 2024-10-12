<script lang="ts">
	import { Input, Label, Spinner } from 'flowbite-svelte';
	import { Check, Ticket as TicketIcon, X, XCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import type { User } from "$lib/auth/user";
	import InfoCard from '$components/InfoCard.svelte';
	import QrReader from '$components/QrReader.svelte';
	import FeedbackToast from '$components/feedbacks/FeedbackToast.svelte';
	import type { Ticket } from '$models/ticket';
	import { user } from '$store/store';

	let ticketInfos: Element | null = null;

	function scrollToDiv() {
		ticketInfos?.scrollIntoView({
			behavior: 'smooth'
		});
	}

	export let data: User;
	if (!$user) $user = data;

	let ticketCode: string = '';
	let ticketCodeInput: string = '';

	let ticket: Ticket;
	let open: boolean = false;

	let timeOut: NodeJS.Timeout;

	async function getTicket(code: string) {
		const res = await fetch(`/api/tickets/${encodeURIComponent(code)}`);
		scrollToDiv();
		ticketCodeInput = '';

		if (res.status == 404) {
			open = true;

			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				open = false;
				clearTimeout(timeOut);
			}, 3500);

			ticket = {
				ticketID: code,
				name: '',
				surname: '',
				seller: '',
				soldAt: null,
				checkIn: null,
				checkOut: null,
				newCheckIn: null
			};
			return;
		}

		let tick = (await res.json()).ticket;

		ticket = {
			ticketID: code,
			name: tick.name,
			surname: tick.surname,
			seller: res.status !== 206 ? tick.seller : 'Non Trovato',
			soldAt: tick.soldAt,
			checkIn: tick.checkIn,
			checkOut: tick.checkOut,
			newCheckIn: tick.newCheckIn
		};
	}

	const reset = () => {
		ticket = {
			ticketID: '',
			name: '',
			surname: '',
			seller: '',
			soldAt: null,
			checkIn: null,
			checkOut: null,
			newCheckIn: null
		};

		ticketCodeInput = '';
		ticketCode = '';
		open = false;
	};

	onMount(async () => {
		ticketInfos = document.querySelector('#ticketInfos');
	});

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && ticketCodeInput !== '') {
			getTicket(ticketCodeInput);
		}
	};

	$: {
		if (ticketCode !== '') {
			getTicket(ticketCode);
		} else {
			reset();
		}
	}
</script>

<svelte:head>
	<title>Info Biglietti</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
	<div class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5">
		{#if $user}
			<h1 class="text-4xl font-bold text-primary-600">Info biglietto</h1>
			<p class="text-justify dark:text-white">
				Scansionare il QR per ottenere informazioni sul biglietto senza influenzare i check-in e le
				vendite
			</p>
			<div class="w-full">
				<Label class="text-md font-medium text-black dark:text-white">
					Codice Biglietto <span class="text-primary-700">*</span>
					<Input
						required
						class="mt-1"
						bind:value={ticketCodeInput}
						name="code"
						autocomplete="off"
						on:keypress={onKeyDown}
					>
						<TicketIcon slot="left" class="h-6 w-6 text-primary-600 dark:text-white" />

						<div slot="right" class="flex h-full items-center gap-2">
							{#if ticketCodeInput !== ''}
								<button on:click={() => getTicket(ticketCodeInput)}>
									<Check color="green" />
								</button>
								<button on:click={reset}>
									<X color="indianred" />
								</button>
							{/if}
						</div>
					</Input>
				</Label>
				<div class="my-6 flex w-full items-center justify-center">
					<QrReader bind:codeResult={ticketCode} />
				</div>

				<InfoCard bind:ticketCode bind:ticket />

				<FeedbackToast bind:open color="red" icon={XCircle} message="Codice biglietto errato" />
			</div>
		{:else}
			<div class="mt-10 flex w-full flex-grow flex-col items-center justify-center gap-5">
				<Spinner size="sm" class="max-w-12 self-center" />
				<span class="text-2xl font-semibold text-primary-600">Attendere...</span>
			</div>
		{/if}
	</div>
</section>
