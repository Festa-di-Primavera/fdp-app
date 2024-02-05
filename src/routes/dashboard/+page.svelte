<script lang="ts">
	import { onMount } from 'svelte';
	import { Card } from 'flowbite-svelte';
	import { onAuthStateChanged, getAuth } from 'firebase/auth';

	import { goto } from '$app/navigation';
	import { getClientApp } from '$lib/firebase/client';

	import { user } from '../../store/store';
	import type { Ticket } from '../../models/ticket';
	import Tickets from '../../components/graphs/Tickets.svelte';
	import CheckInPerTime from '../../components/graphs/CheckInPerTime.svelte';
	import TicketsPerPerson from '../../components/graphs/TicketsPerPerson.svelte';

	export let data: { strTicketData: string };

	let tickets: Ticket[] = JSON.parse(data.strTicketData) as Ticket[];

	let numberOfCheckIns: number = 0;
	let ticketsCheckIn: { x: string; y: number }[] = [];

	let checkedTicketsCount: number = tickets.filter((ticket) => ticket.checkIn !== null).length;
	let notCheckedTicketsCount: number =
		tickets.filter((ticket) => ticket.soldAt !== null).length - checkedTicketsCount;
	let notSoldTicketsCount: number = tickets.filter((ticket) => ticket.soldAt === null).length;

	interface TimeSlotData {
		x: string;
		y: number;
	}

	let mappings: Map<string, number> = new Map();

	function computeData(tickets: Ticket[], slotTime: number, maxSlots: number): TimeSlotData[] {
		const timeSlotsMap: Map<number, number> = new Map();

		for (let ticket of tickets) {
			if (ticket.checkIn !== null) {
				const timestamp = new Date(ticket.checkIn).getTime();
				const slotIndex = Math.floor(timestamp / slotTime);
				timeSlotsMap.set(slotIndex, (timeSlotsMap.get(slotIndex) || 0) + 1);
			}

			if (ticket.seller !== null) {
				mappings.set(ticket.seller, (mappings.get(ticket.seller) || 0) + 1);
			}
		}

		const sortedTimeSlots = Array.from(timeSlotsMap.entries()).sort((a, b) => a[0] - b[0]);

		const timeSlotData: TimeSlotData[] = [];
		let currentSlotIndex = sortedTimeSlots[0][0];
		let currentIndex = 0;
		numberOfCheckIns = 0;

		while (currentIndex < sortedTimeSlots.length) {
			if (sortedTimeSlots[currentIndex][0] === currentSlotIndex) {
				const timestamp = currentSlotIndex * slotTime;
				const date = new Date(timestamp);
				numberOfCheckIns += sortedTimeSlots[currentIndex][1];

				const label = date.toString();
				timeSlotData.push({ x: label, y: sortedTimeSlots[currentIndex][1] });
				currentIndex++;
			} else {
				const timestamp = currentSlotIndex * slotTime;
				const date = new Date(timestamp);

				const label = date.toString();
				timeSlotData.push({ x: label, y: 0 });
			}
			currentSlotIndex++;
		}

		return timeSlotData;
	}

	let timeWindowCheckinPerTime = 1000 * 60 * 60 * 24; // 1 day
	let numberOfBarCheckinPerTime = 7;

	ticketsCheckIn = computeData(tickets, timeWindowCheckinPerTime, numberOfBarCheckinPerTime);

	$: {
		ticketsCheckIn = computeData(tickets, timeWindowCheckinPerTime, numberOfBarCheckinPerTime);
	}

	onMount(async () => {
		onAuthStateChanged(getAuth(getClientApp()), (newUser) => {
			$user = newUser;
			if ($user === null) {
				goto('/');
				return;
			}
		});
	});
</script>

{#if $user}
	<section class="flex h-full w-full flex-col items-center gap-4">
		<div class="flex w-full max-w-96 flex-col items-start gap-4 px-5 pb-12 pt-5">
			<h1 class="text-4xl font-bold text-primary-600">Dashboard</h1>
			<p class="text-justify dark:text-white">Informazioni relative ai biglietti</p>

			<div class="grid w-full grid-flow-row-dense grid-cols-2 gap-2">
				<Card class="col-span-2 flex w-full flex-col items-center gap-5 pt-6">
					<h1 class="text-center text-5xl font-bold text-primary-600">
						{checkedTicketsCount !== undefined ? checkedTicketsCount : '--'}
					</h1>
					<p class="text-center dark:text-white">Biglietti validati</p>
				</Card>

				<Card class="flex aspect-square w-full flex-col items-center gap-5 pt-6">
					<h1 class="text-center text-5xl font-bold text-primary-600">
						{notCheckedTicketsCount !== undefined ? notCheckedTicketsCount : '--'}
					</h1>
					<p class="text-center dark:text-white">Biglietti venduti non validati</p>
				</Card>

				<Card class="flex aspect-square w-full flex-col items-center gap-5 pt-6">
					<h1 class="text-center text-5xl font-bold text-primary-600">
						{notSoldTicketsCount !== undefined ? notSoldTicketsCount : '--'}
					</h1>
					<p class="text-center dark:text-white">Biglietti non venduti</p>
				</Card>
			</div>

			<Tickets bind:checkedTicketsCount bind:notSoldTicketsCount bind:notCheckedTicketsCount />
			<TicketsPerPerson bind:mappings />
			<CheckInPerTime
				bind:ticketsCheckIn
				bind:numberOfCheckIns
				bind:timeWindow={timeWindowCheckinPerTime}
				bind:numberOfBar={numberOfBarCheckinPerTime}
			/>
		</div>
	</section>
{/if}
