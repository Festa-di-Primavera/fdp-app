<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '../../store/store';
	import { onAuthStateChanged } from 'firebase/auth';
	import type { Ticket } from '../../models/ticket';
	import { Card } from 'flowbite-svelte';
	import { clientAuth } from '../../lib/firebase/firebase';
	import { goto } from '$app/navigation';
	import Tickets from '../../components/graphs/Tickets.svelte';

	let tickets: Ticket[];
	let checkedTicketsCount: number;
	let notCheckedTicketsCount: number;
	let notSoldTicketsCount: number;

	onMount(async() => {
		onAuthStateChanged(clientAuth, (newUser) => {
			$user = newUser;
			if($user === null){
				goto("/");
				return;
			}
		});

		const res = await fetch("/api/tickets");
		tickets = (await res.json()).body.tickets;
		checkedTicketsCount = tickets.filter(ticket => ticket.checkIn !== null).length;
		notCheckedTicketsCount = tickets.filter(ticket => ticket.soldAt !== null).length - checkedTicketsCount;
		notSoldTicketsCount = tickets.filter(ticket => ticket.soldAt === null).length;
	});
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
		</div>
	</section>
{/if}