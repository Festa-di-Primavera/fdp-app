<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '../../store/store';
	import { onAuthStateChanged } from 'firebase/auth';
	import type { Ticket } from '../../models/ticket';
	import { Card } from 'flowbite-svelte';
	import { clientAuth } from '../../lib/firebase/firebase';
	import { goto } from '$app/navigation';
	import Tickets from '../../components/graphs/Tickets.svelte';
	import TicketsPerPerson from '../../components/graphs/TicketsPerPerson.svelte';
	import CheckInPerTime from '../../components/graphs/CheckInPerTime.svelte';

	export let data: { strTicketData: string };

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
</script>

{#if $user}
	<section class="w-full h-full flex flex-col items-center gap-4">
		<div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12">
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
		</div>
	</section>
{/if}