<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Card, Spinner, Toast } from 'flowbite-svelte';
	import { getAuth, signInWithCustomToken } from 'firebase/auth';

	import { getClientApp, getClientDB } from '$lib/firebase/client';
	
	import { XCircle } from 'lucide-svelte';

	import { user } from '../../store/store';
	import type { Ticket } from '../../models/ticket';
	import { computeSellersStats, computeSalesPerHour, computeSalesPerTime, computeCheckInPerTime, SalesTimeSlot, CheckInTimeSlot } from '$lib/graphs/utils';

	import TicketsECharts from '../../components/graphs/TicketsECharts.svelte';
	import ExportToCsv from '../../components/ExportToCSV.svelte';
	import SalesPerTimeECharts from '../../components/graphs/SalesPerTimeECharts.svelte';
	import TicketsPerPersonECharts from '../../components/graphs/TicketsPerPersonECharts.svelte';
	import CheckInPerTimeECharts from '../../components/graphs/CheckInPerTimeECharts.svelte';
	import TicketsPerHourECharts from '../../components/graphs/TicketsPerHourECharts.svelte';
	import { collection, onSnapshot, query } from 'firebase/firestore';

	export let data: { token:string, sellers: {uid: string; alias: string}[] };
	
	let toastOpen: boolean = false;
	let toastMessage: string = '';

	let tickets: Ticket[] = [];

	const q = query(collection(getClientDB(), "tickets"));
	const unsubscribe = onSnapshot(q, (querySnapshot) => {
		console.log('tickets updated');
		tickets = querySnapshot.docs.map((ticketDoc) => {
			let currSeller: string | null;

			if(!ticketDoc.data().seller) {
				currSeller = null;
			} else {
				currSeller = data.sellers.find((seller) => seller.uid === ticketDoc.data().seller)?.alias || "AnOnImO";
			}

			return (
				{
					ticketID: ticketDoc.id,
					name: ticketDoc.data().name,
					surname: ticketDoc.data().surname,
					checkIn: ticketDoc.data().checkIn?.toDate() || null,
					soldAt: ticketDoc.data().soldAt?.toDate() || null,
					seller: currSeller,
				} as Ticket
			);
		});
	});

	// cards and pie chart data
	$: checkedTicketsCount = tickets.filter((ticket) => ticket.checkIn !== null).length;
	$: notCheckedTicketsCount = tickets.filter((ticket) => ticket.soldAt !== null).length - checkedTicketsCount;
	$: notSoldTicketsCount = tickets.filter((ticket) => ticket.soldAt === null).length;

	let timeWindowSalesPerTime: SalesTimeSlot = SalesTimeSlot.DAY;
	let timeWindowCheckInPerTime: CheckInTimeSlot = CheckInTimeSlot.HOUR;
	
	$: sellersStats = computeSellersStats(tickets);
	$: sellHoursStats = computeSalesPerHour(tickets);
	$: salesPerTime = computeSalesPerTime(tickets, timeWindowSalesPerTime);
	$: checkInPerTime = computeCheckInPerTime(tickets, timeWindowCheckInPerTime);
	
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

	onDestroy(() => {
		unsubscribe();
	});
</script>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
	<div class="w-full px-5 pt-5 flex flex-col gap-4 pb-12 flex-grow">
		{#if $user}
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
			</div>
				<ExportToCsv bind:tickets />
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

