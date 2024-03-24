<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Card, Modal, Spinner, Toast, Input, Label, Button } from 'flowbite-svelte';
	import { getAuth, signInWithCustomToken } from 'firebase/auth';

	import { getClientApp, getClientDB, handleSignOut } from '$lib/firebase/client';
	
	import { XCircle } from 'lucide-svelte';

	import { user } from '../../store/store';
	import type { Ticket } from '../../models/ticket';
	import { computeSellersStats, computeSalesPerHour, computeSalesPerTime, computeCheckInPerTime, SalesTimeSlot, CheckInTimeSlot, computeCheckOutPerTime, CheckOutTimeSlot } from '$lib/graphs/utils';

	import TicketsECharts from '../../components/graphs/TicketsECharts.svelte';
	import ExportToCsv from '../../components/ExportToCSV.svelte';
	import SalesPerTimeECharts from '../../components/graphs/SalesPerTimeECharts.svelte';
	import TicketsPerPersonECharts from '../../components/graphs/TicketsPerPersonECharts.svelte';
	import CheckInPerTimeECharts from '../../components/graphs/CheckInPerTimeECharts.svelte';
	import TicketsPerHourECharts from '../../components/graphs/TicketsPerHourECharts.svelte';
	import { collection, onSnapshot, query, type Unsubscribe } from 'firebase/firestore';
	import CheckOutPerTimeECharts from '../../components/graphs/CheckOutPerTimeECharts.svelte';
	import { goto } from '$app/navigation';
	import SignInToast from '../../components/feedbacks/SignInToast.svelte';

	export let data: {logout?: boolean, token?: string, sellers?: {uid: string; alias: string}[] };
	
	let signInToastOpen: boolean = false;
	let signInToastMessage: string = '';

	let tickets: Ticket[] = [];
	let unsubscribe: Unsubscribe = () => {};

	// cards and pie chart data
	$: checkedTicketsCount = tickets.filter((ticket) => ticket.checkIn !== null).length;
	$: notCheckedTicketsCount = tickets.filter((ticket) => ticket.soldAt !== null).length - checkedTicketsCount;
	$: notSoldTicketsCount = tickets.filter((ticket) => ticket.soldAt === null).length;

	let timeWindowSalesPerTime: SalesTimeSlot = SalesTimeSlot.DAY;
	let timeWindowCheckInPerTime: CheckInTimeSlot = CheckInTimeSlot.HOUR;
	let timeWindowCheckOutPerTime: CheckOutTimeSlot = CheckOutTimeSlot.HALF_HOUR;
	
	$: sellersStats = computeSellersStats(tickets);
	$: sellHoursStats = computeSalesPerHour(tickets);
	$: salesPerTime = computeSalesPerTime(tickets, timeWindowSalesPerTime);
	$: checkInPerTime = computeCheckInPerTime(tickets, timeWindowCheckInPerTime);
	$: checkOutPerTime = computeCheckOutPerTime(tickets, timeWindowCheckOutPerTime);

	let open: boolean = true;
	let value: string = '';
	$: validate = value !== 'Festa di Primavera';

	// get tickets from firestore
	function getTickets(){
		if(getAuth(getClientApp()).currentUser){
			const q = query(collection(getClientDB(), "tickets"));
			unsubscribe = onSnapshot(q, (querySnapshot) => {
				tickets = querySnapshot.docs.map((ticketDoc) => {
					let currSeller: string | null;

					if(!ticketDoc.data().seller) {
						currSeller = null;
					} else {
						currSeller = data.sellers?.find((seller) => seller.uid === ticketDoc.data().seller)?.alias || "AnOnImO";
					}

					return (
						{
							ticketID: ticketDoc.id,
							name: ticketDoc.data().name,
							surname: ticketDoc.data().surname,
							seller: currSeller,
							soldAt: ticketDoc.data().soldAt?.toDate() || null,
							checkIn: ticketDoc.data().checkIn?.toDate() || null,
							checkOut: ticketDoc.data().checkOut?.toDate() || null,
							newCheckIn: ticketDoc.data().newCheckIn?.toDate() || null
						}
					);
				});
			});
		}
	}
	
	onMount(async() => {
		if(data.logout){
			handleSignOut(true);
			return;
		}

		if(getAuth(getClientApp()).currentUser === null && data.token){
			await signInWithCustomToken(getAuth(), data.token).then((userCredential) => {
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
				const timeOut = setTimeout(() => {
					signInToastOpen = false;
					clearTimeout(timeOut);
				}, 8000);
			});
		}
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
	<div class="w-full px-5 pt-5 flex flex-col gap-4 pb-12 flex-grow">
		{#if $user}
			{#if tickets.length > 0}
				<div class="m-auto w-full max-w-sm md:max-w-3xl xl:max-w-6xl 2xl:max-w-[1584px]">
					<h1 class="text-4xl font-bold text-primary-600">Dashboard</h1>
					<p class="text-justify dark:text-white">Informazioni relative ai biglietti</p>
				</div>
				
				<div class="m-auto grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
					<div class="grid h-full w-full max-w-sm grid-flow-row-dense grid-cols-2 gap-2">
						<Card
							class="col-span-2 flex h-full w-full max-w-md flex-col items-center justify-center gap-5 pt-6"
						>
							<h1 class="text-center text-5xl font-bold text-primary-600">
								{checkedTicketsCount !== undefined ? checkedTicketsCount : '--'}
							</h1>
							<p class="text-center dark:text-white">Biglietti validati</p>
						</Card>

						<Card
							class="flex aspect-square h-full w-full flex-col items-center justify-center gap-5 pt-6"
						>
							<h1 class="text-center text-5xl font-bold text-primary-600">
								{notCheckedTicketsCount !== undefined ? notCheckedTicketsCount : '--'}
							</h1>
							<p class="text-center dark:text-white">Biglietti venduti non validati</p>
						</Card>

						<Card
							class="flex aspect-square h-full w-full flex-col items-center justify-center gap-5 pt-6"
						>
							<h1 class="text-center text-5xl font-bold text-primary-600">
								{notSoldTicketsCount !== undefined ? notSoldTicketsCount : '--'}
							</h1>
							<p class="text-center dark:text-white">Biglietti non venduti</p>
						</Card>
					</div>

					<TicketsECharts bind:checkedTicketsCount bind:notCheckedTicketsCount bind:notSoldTicketsCount />
					<TicketsPerPersonECharts bind:sellersStats />
					<TicketsPerHourECharts bind:sellHoursStats />

					<SalesPerTimeECharts
						bind:ticketsData={salesPerTime}
						bind:timeWindow={timeWindowSalesPerTime}
					/>

					<CheckInPerTimeECharts
						bind:ticketsData={checkInPerTime}
						bind:timeWindow={timeWindowCheckInPerTime}
					/>

					<CheckOutPerTimeECharts
						bind:ticketsData={checkOutPerTime}
						bind:timeWindow={timeWindowCheckOutPerTime}
					/>
				</div>
				<ExportToCsv bind:tickets />
			{/if}
		{:else}
			<div class="w-full flex flex-col flex-grow gap-5 items-center justify-center mt-10">
				<Spinner size="sm" class="max-w-12 self-center"/>
				<span class="text-primary-600 font-semibold text-2xl">Attendere...</span>
			</div>
		{/if}
	</div>
</section>

<SignInToast bind:open={signInToastOpen} bind:message={signInToastMessage} />
<Modal bind:open dismissable={false}>
	<div slot="header" class="flex justify-between items-center">
		<h1 class="text-2xl text-primary-300">Conferma visita</h1>
	</div>
	<div class="leading-8">
		<p class="select-none">
			Per evitare letture non necessarie, confermare di voler visitare questa pagina.<br/>
			Inserisci nel campo sottostante il codice <span class="py-1 px-2 break-keep whitespace-nowrap font-mono bg-primary-400 rounded-md bg-opacity-20">Festa di Primavera</span> per confermare.
		</p>
		<Label class="flex flex-col mt-7 gap-1">
			Codice di conferma
			<Input placeholder="Festa di Primavera" bind:value/>
		</Label>
	</div>
	<div slot="footer" class="flex gap-3">
		<Button bind:disabled={validate} color="primary" on:click={() => {if(value === 'Festa di Primavera') {getTickets(); open=false}}}>Conferma</Button>
		<Button color="alternative" on:click={() => goto("/")}>Annulla</Button>
	</div>
</Modal>