<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import type { Ticket } from '../models/ticket';

	export let tickets: Ticket[] = [];

	function downloadCSV() {
		const rows = [
			['TicketID', 'Name', 'Surname', 'CheckIn', 'SoldAt', 'Seller'],
			...tickets.map((ticket) => [
				ticket.ticketID,
				ticket.name,
				ticket.surname,
				ticket.checkIn,
				ticket.soldAt,
				ticket.seller
			])
		];

		let csvContent = 'data:text/csv;charset=utf-8,';
		rows.forEach((rowArray) => {
			let row = rowArray.join(',');
			csvContent += row + '\r\n';
		});

		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', 'ticketsFDP.csv');
		document.body.appendChild(link);

		link.click();
	}
</script>

<div
	class="m-auto flex w-full max-w-sm flex-row items-center justify-end md:max-w-3xl xl:max-w-6xl 2xl:max-w-[1584px]"
>
	<Button on:click={downloadCSV}>Export to CSV</Button>
</div>
