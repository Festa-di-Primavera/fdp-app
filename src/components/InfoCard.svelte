<script lang="ts">
	import { Card } from "flowbite-svelte";
	import type { Ticket } from "$models/ticket";
	import { convertCode } from "$lib/utils/tickets";

	interface Props {
		ticketCode: string;
		ticket: Ticket | undefined;
		color?: string;
		focus?: 'checkIn' | 'checkOut' | 'newCheckIn' | null;
	}

	let {
		ticketCode = $bindable(),
		ticket = $bindable(),
		color = $bindable(''),
		focus = $bindable(null),
	}: Props = $props();
</script>

<Card class="w-full flex flex-col text-lg p-3" id="ticketInfos">
	<span class="text-black dark:text-white w-full flex justify-between">
		<span>N° biglietto:</span>
		<span>{convertCode(ticket?.ticketID) || convertCode(ticketCode) || ''}</span>
	</span>
	<span class="text-black dark:text-white w-full flex justify-between">
		<span>Nominativo:</span>
		<span>{(ticket?.name || '') + ' ' + (ticket?.surname || '')}</span>
	</span>
	<span class="text-black dark:text-white w-full flex justify-between">
		<span>Venditore:</span>
		<span>{ticket?.seller || ''}</span>
	</span>
	<span class="text-black dark:text-white w-full flex justify-between">
		<span>Venduto:</span>
		<span>{ticket?.soldAt ? (new Date(ticket.soldAt)).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : ''}</span>
	</span>
	<span class="text-black dark:text-white w-full flex justify-between">
		<span>Entrata:</span>
		<span class="{focus == 'checkIn' && color ? `text-${color}-400` : ""} font-bold">{ticket?.checkIn ? (new Date(ticket.checkIn)).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : ''}</span>
	</span>
	{#if ticket?.checkOut}
		<span class="text-black dark:text-white w-full flex justify-between">
			<span>Uscita:</span>
			<span class="{focus == 'checkOut' && color ? `text-${color}-400` : ""} font-bold">{(new Date(ticket.checkOut)).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</span>
		</span>
	{/if}
	{#if ticket?.newCheckIn}
		<span class="text-black dark:text-white w-full flex justify-between">
			<span>Rientro:</span>
			<span class="{focus == 'newCheckIn' && color ? `text-${color}-400` : ""} font-bold">{(new Date(ticket.newCheckIn)).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</span>
		</span>
	{/if}
</Card>