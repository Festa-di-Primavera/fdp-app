<script lang="ts">
	import { Button, Input, Label, Modal, Spinner } from 'flowbite-svelte';
	import {
		AlertCircle,
		Check,
		CheckCircle2,
		Ticket as TicketIcon,
		X,
		XCircle
	} from 'lucide-svelte';
	import { onDestroy, onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import FeedbackToast from '$components/feedbacks/FeedbackToast.svelte';
	import InfoCard from '$components/InfoCard.svelte';
	import QrReader from '$components/QrReader.svelte';
	import type { Ticket } from '$models/ticket';
	import { user } from '$store/store';
	import type { User } from '$lib/auth/user';

	interface Props {
		data: User;
	}

	let { data }: Props = $props();
	if (!$user) $user = data;

	let ticketCode: string = $state('');
	let ticketCodeInput: string = $state('');

	let ticket: Ticket | undefined = $state();
	let feedbackToastOpen: boolean = $state(false);
	let feedbackMessage: string = $state('');
	let redirectTimeOut: NodeJS.Timeout;
	let timeOut: NodeJS.Timeout;
	let errorsModalOpen: boolean = $state(false);

	const closeErrorsModal = () => {
		errorsModalOpen = false;
	};

	let ticketStatus: 'alert' | 'error' | 'success' | null = $state(null);

	let color: 'green' | 'red' | 'yellow' = $state('green');

	let ticketInfos: Element | null = null;

	function scrollToDiv() {
		ticketInfos?.scrollIntoView({
			behavior: 'smooth'
		});
	}

	async function checkOutTicket(code: string) {
		scrollToDiv();

		const response = await fetch(`/api/tickets/checkout/${encodeURIComponent(code)}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		const body = await response.json();
		let message = body.message;

		if (response.status == 404) {
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

			triggerPopup(message, 'red', 'error');
			ticketCodeInput = '';
			return;
		}

		let tick = body.ticket;

		if (response.status == 402) {
			ticket = {
				ticketID: code,
				name: tick.name,
				surname: tick.surname,
				seller: tick.seller,
				soldAt: tick.soldAt,
				checkIn: tick.checkIn,
				checkOut: tick.checkOut,
				newCheckIn: tick.newCheckIn
			};

			triggerPopup(message, 'red', 'error');
			ticketCodeInput = '';
			return;
		}

		if (response.status === 409 || response.status === 406) {
			ticket = {
				ticketID: code,
				name: tick.name,
				surname: tick.surname,
				seller: tick.seller,
				soldAt: tick.soldAt,
				checkIn: tick.checkIn,
				checkOut: tick.checkOut,
				newCheckIn: tick.newCheckIn
			};

			triggerPopup(message, 'yellow', 'alert');
			ticketCodeInput = '';
			return;
		}

		try {
			ticket = {
				ticketID: code,
				name: tick.name,
				surname: tick.surname,
				seller: response.status !== 206 ? tick.seller : 'Non Trovato',
				soldAt: tick.soldAt,
				checkIn: tick.checkIn,
				checkOut: tick.checkOut,
				newCheckIn: tick.newCheckIn
			};

			triggerPopup(message, 'green', null);
			ticketCodeInput = '';
		} catch (e) {
			triggerPopup('Errore inaspettato', 'red', 'error');
			ticketCodeInput = '';
		}
		return;
	}

	function triggerPopup(
		message: string,
		col: 'red' | 'green' | 'yellow',
		status: 'error' | 'alert' | 'success' | null
	) {
		feedbackMessage = message;
		if (status != null) errorsModalOpen = true;
		else feedbackToastOpen = true;
		color = col;
		ticketStatus = status;

		clearTimeout(timeOut);
		if (ticketStatus === null) {
			timeOut = setTimeout(() => {
				ticketStatus = null;
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
		}
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
		feedbackToastOpen = false;
		ticketStatus = null;
		color = 'green';
	};

	const getRemainingTime = () => {
		let now = new Date();
		let checkOutTime = new Date();
		checkOutTime.setHours(16, 52, 0, 0);

		return checkOutTime.getTime() - now.getTime();
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && ticketCodeInput !== '') {
			checkOutTicket(ticketCodeInput);
		}
	};

	onMount(async () => {
		ticketInfos = document.querySelector('#ticketInfos');

		redirectTimeOut = setTimeout(() => {
			clearTimeout(redirectTimeOut);
			goto('/?checkOutExpired');
		}, getRemainingTime());
	});

	onDestroy(() => {
		clearTimeout(redirectTimeOut);
	});

	$effect(() => {
		if (ticketCode !== '') {
			checkOutTicket(ticketCode);
		} else {
			reset();
		}
	});
	let ToastIcon = $state(CheckCircle2);
	$effect(() => {
		ToastIcon =
			ticketStatus === 'error' ? XCircle : ticketStatus === 'alert' ? AlertCircle : CheckCircle2;
	});
</script>

<svelte:head>
	<title>Check-out</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
	<div class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5">
		{#if $user}
			<h1 class="text-4xl font-bold text-primary-600">Check-out</h1>
			<p class="text-justify dark:text-white">
				Scansionare il QR per effettuare il check-out entro le 20:00
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
								<button onclick={() => checkOutTicket(ticketCodeInput)}>
									<Check color="green" />
								</button>
								<button onclick={reset}>
									<X color="indianred" />
								</button>
							{/if}
						</div>
					</Input>
				</Label>
				<div class="my-6 flex w-full items-center justify-center">
					<QrReader bind:codeResult={ticketCode} />
				</div>

				<InfoCard bind:ticketCode bind:ticket bind:color focus="checkOut" />

				<FeedbackToast
					bind:open={feedbackToastOpen}
					bind:color
					bind:message={feedbackMessage}
					bind:ToastIcon
				/>
				<Modal
					bind:open={errorsModalOpen}
					on:close={closeErrorsModal}
					size="xs"
					dismissable={false}
				>
					{@const SvelteComponent =
						ticketStatus === 'error'
							? XCircle
							: ticketStatus === 'alert'
								? AlertCircle
								: CheckCircle2}
					<span
						class="my-5 justify-center text-3xl font-semibold text-{color}-500 flex items-center gap-2"
					>
						<SvelteComponent class="h-6 w-6  text-{color}-400" />
						{feedbackMessage}
					</span>
					<Button slot="footer" class="w-full" on:click={closeErrorsModal}>Chiudi</Button>
				</Modal>
			</div>
		{:else}
			<div class="mt-10 flex w-full flex-grow flex-col items-center justify-center gap-5">
				<Spinner size="sm" class="max-w-12 self-center" />
				<span class="text-2xl font-semibold text-primary-600">Attendere...</span>
			</div>
		{/if}
	</div>
</section>
