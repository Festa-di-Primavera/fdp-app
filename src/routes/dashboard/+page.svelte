<script lang="ts">
	import { onMount } from 'svelte';
	import { handleSignOut, user } from '../../store/store';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';
	import type { Ticket } from '../../models/ticket';
	import { Card } from 'flowbite-svelte';
	import { ScanLine } from 'lucide-svelte';

	let tickets: Ticket[];
	let checkedTicketsCount: number;
	let notCheckedTicketsCount: number;
	let notSoldTicketsCount: number;

	onMount(async() => {
		const res = await fetch("/api/tickets");
		tickets = (await res.json()).body.tickets;
		checkedTicketsCount = tickets.filter(ticket => ticket.checkIn !== null).length;
		// soldTicket = tickets sold - tickets checked
		notCheckedTicketsCount = tickets.filter(ticket => ticket.soldAt !== null).length - checkedTicketsCount;
		notSoldTicketsCount = tickets.filter(ticket => !ticket.soldAt === null).length;
	});


	const auth = getAuth();

	onAuthStateChanged(auth, (newUser) => {
	  $user = newUser;
	});
</script>

<section class="w-full h-full flex flex-col items-center gap-4">
	<div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12">
		<h1 class="text-primary-600 font-bold text-4xl">Dashboard</h1>
		<p class="dark:text-white text-justify">Informazioni relative ai biglietti</p>
		
		<div class="w-full grid grid-cols-2 gap-2 grid-flow-row-dense">
			<Card class="col-span-2 w-full flex flex-col gap-5 items-center pt-6">
				<h1 class="text-primary-600 font-bold text-5xl text-center">{checkedTicketsCount}</h1>
				<p class="dark:text-white text-center">Biglietti validati</p>
			</Card>

			<Card class="w-full aspect-square flex flex-col gap-5 items-center pt-6">
				<h1 class="text-primary-600 font-bold text-5xl text-center">{notCheckedTicketsCount}</h1>
				<p class="dark:text-white text-center">Biglietti venduti<br> non controllati</p>
			</Card>

			<Card class="w-full aspect-square flex flex-col gap-5 items-center pt-6">
				<h1 class="text-primary-600 font-bold text-5xl text-center">{notSoldTicketsCount}</h1>
				<p class="dark:text-white text-center">Biglietti non venduti</p>
			</Card>
		</div>
    </div>
</section>