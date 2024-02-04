<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, Spinner, Toast } from 'flowbite-svelte';
	import { getAuth, signInWithCustomToken } from 'firebase/auth';

	import { getClientApp } from '$lib/firebase/client';

	import { user } from '../../store/store';
	import type { Ticket } from '../../models/ticket';
	import Tickets from '../../components/graphs/Tickets.svelte';
	import CheckInPerTime from '../../components/graphs/CheckInPerTime.svelte';
	import TicketsPerPerson from '../../components/graphs/TicketsPerPerson.svelte';
	import { XCircle } from 'lucide-svelte';

	export let data: { token:string, strTicketData: string };
	
	let toastOpen: boolean = false;
	let toastMessage: string = '';

	let tickets: Ticket[] = JSON.parse(data.strTicketData) as Ticket[];
	
	let numberOfCheckIns: number = 0;
	let ticketsCheckIn: { x: string, y: number }[] = [];

	let checkedTicketsCount: number = tickets.filter(ticket => ticket.checkIn !== null).length;
	let notCheckedTicketsCount: number = tickets.filter(ticket => ticket.soldAt !== null).length - checkedTicketsCount;
	let notSoldTicketsCount: number = tickets.filter(ticket => ticket.soldAt === null).length;

	let mappings: Map<string, number> = new Map();
	function computeData(tickets: Ticket[]): void {
		const mapHourToCount: Map<string, number> = new Map();
		
		for(let ticket of tickets){
			if(ticket.checkIn !== null){
				const date = new Date(ticket.checkIn);
				const hour = date.getHours();
				const count = mapHourToCount.get(hour.toString()) || 0;
				mapHourToCount.set(hour.toString(), count + 1);
				numberOfCheckIns++;
			}

			if(ticket.seller !== null){
				mappings.set(ticket.seller, (mappings.get(ticket.seller) || 0) + 1);
			}
		}
		
		mapHourToCount.forEach((value, key) => {
			ticketsCheckIn.push({ x: key, y: value });
		});
		ticketsCheckIn.sort((a, b) => parseInt(a.x) - parseInt(b.x));
		ticketsCheckIn = ticketsCheckIn;
	}
	
	computeData(tickets);

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
	<div class="w-full px-5 pt-5 flex flex-col gap-4 max-w-96 pb-12 flex-grow">
		{#if $user}
			<h1 class="text-primary-600 font-bold text-4xl">Dashboard</h1>
			<p class="dark:text-white text-justify">Informazioni relative ai biglietti</p>
			
			<div class="w-full grid grid-cols-2 gap-2 grid-flow-row-dense">
				<Card class="col-span-2 w-full flex flex-col gap-5 items-center pt-6">
					<h1 class="text-primary-600 font-bold text-5xl text-center">{checkedTicketsCount !== undefined ? checkedTicketsCount : '--'}</h1>
					<p class="dark:text-white text-center">Biglietti validati</p>
				</Card>

				<Card class="w-full aspect-square flex flex-col gap-5 items-center pt-6">
					<h1 class="text-primary-600 font-bold text-5xl text-center">{notCheckedTicketsCount !== undefined ? notCheckedTicketsCount : '--'}</h1>
					<p class="dark:text-white text-center">Biglietti venduti non validati</p>
				</Card>

				<Card class="w-full aspect-square flex flex-col gap-5 items-center pt-6">
					<h1 class="text-primary-600 font-bold text-5xl text-center">{notSoldTicketsCount !== undefined ? notSoldTicketsCount : '--'}</h1>
					<p class="dark:text-white text-center">Biglietti non venduti</p>
				</Card>
			</div>

			<Tickets bind:checkedTicketsCount bind:notSoldTicketsCount bind:notCheckedTicketsCount/>
			<TicketsPerPerson bind:mappings/>
			<CheckInPerTime bind:ticketsCheckIn bind:numberOfCheckIns/>
		{:else}
			<div class="w-full flex flex-col flex-grow gap-5 items-center justify-center mt-10">
				<Spinner size="sm" class="max-w-12 self-center"/>
				<span class="text-primary-600 font-semibold text-2xl">Attendere...</span>
			</div>
		{/if}
	</div>
</section>

<Toast bind:open={toastOpen} color="red" class="w-max mt-10 mb-5 mx-auto right-0 left-0" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<XCircle class="w-6 h-6  text-red-400" slot="icon"/>
	<span class='text-red-400 font-semibold'>{toastMessage}</span>
</Toast>