<script lang="ts">
	import {
		Button,
		Datepicker,
		Hr,
		Indicator,
		Input,
		Label,
		Modal,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import type { User } from 'lucia';
	import {
		ArrowDown01,
		ArrowDownAZ,
		ArrowUp01,
		ArrowUpAZ,
		CheckCircle2,
		Pen,
		XCircle
	} from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import FeedbackToast from '$components/feedbacks/FeedbackToast.svelte';
	import type { Ticket } from '$models/ticket';
	import { user } from '$store/store';
	import { collection, onSnapshot, query, type Unsubscribe } from 'firebase/firestore';
	import { getClientDB } from '$lib/firebase/client';
	import { formatDate } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';

	export let data: { currUser: User; sellers: Map<string, string> };

	if (!$user) $user = data.currUser;

	let unsubscribe: Unsubscribe = () => {};

	function getTickets() {
		const q = query(collection(getClientDB(), 'tickets'));
		unsubscribe = onSnapshot(q, (querySnapshot) => {
			tickets = querySnapshot.docs.map((ticketDoc) => {
				const currentTicket = ticketDoc.data();
				const sellerName = data.sellers.get(currentTicket.seller) || 'Anonimo';

				return {
					ticketID: ticketDoc.id,
					name: currentTicket.name,
					surname: currentTicket.surname,
					seller: sellerName,
					soldAt: currentTicket.soldAt?.toDate() || null,
					checkIn: currentTicket.checkIn?.toDate() || null,
					checkOut: currentTicket.checkOut?.toDate() || null,
					newCheckIn: currentTicket.newCheckIn?.toDate() || null
				};
			});
		});
	}

	onMount(() => {
		getTickets();
	});

	onDestroy(() => {
		unsubscribe();
	});

	let tickets: Ticket[] = [];

	let color: 'green' | 'red' = 'green';
	let feedbackToastMessage: string = '';
	let error: boolean = false;
	let feedbackToastOpen: boolean = false;
	let timeOut: NodeJS.Timeout;

	let filteredItems: Ticket[] = [];

	const sortKey = writable('code'); // name, surname, ticketID, seller, soldAt, checkIn
	const sortDirection = writable(1);
	const sortItems = writable(filteredItems.slice());

	const sortTable = (key: string) => {
		if ($sortKey === key) {
			sortDirection.update((val) => -val);
		} else {
			sortKey.set(key);
			sortDirection.set(1);
		}
	};

	const filters = {
		name: '',
		surname: '',
		ticketID: '',
		seller: ''
	};

	$: {
		filteredItems = tickets?.filter((item: Ticket) => {
			// filter by name, surname, ticketID, seller if the value is not empty
			return (
				(item.name?.toLowerCase().includes(filters.name.toLowerCase()) || filters.name === '') &&
				(item.surname?.toLowerCase().includes(filters.surname.toLowerCase()) ||
					filters.surname === '') &&
				(item.ticketID?.toLowerCase().includes(filters.ticketID.toLowerCase()) ||
					filters.ticketID === '') &&
				(item.seller?.toLowerCase().includes(filters.seller.toLowerCase()) || filters.seller === '')
			);
		});

		const key = $sortKey;
		const direction = $sortDirection;
		sortItems.set(filteredItems);

		if ($sortItems?.length > 0) {
			const sorted = [...$sortItems].sort((a, b) => {
				let aVal: any;
				let bVal: any;

				if (
					key === 'ticketID' ||
					key == 'name' ||
					key == 'surname' ||
					key == 'ticketID' ||
					key == 'seller' ||
					key == 'soldAt' ||
					key == 'checkIn'
				) {
					aVal = a[key];
					bVal = b[key];
				}

				if (aVal === null && bVal === null) {
					return 0;
				} else if (aVal === null) {
					return direction;
				} else if (bVal === null) {
					return -direction;
				} else if (aVal < bVal) {
					return -direction;
				} else if (aVal > bVal) {
					return direction;
				}
				return 0;
			});
			sortItems.set(sorted);
		}
	}
	$: toastIcon = error ? XCircle : CheckCircle2;

	let currSelectedTicket: Ticket;

	let attrModalOpen: boolean = false;
	let attribute: string = '';
	let currAttr: 'name' | 'surname';

	const triggerAttrModify = async (ticket: Ticket, attr: 'name' | 'surname') => {
		currSelectedTicket = ticket;
		attrModalOpen = true;
		currAttr = attr;
	};

	async function handleAttrModify() {
		if (attribute != '') {
			const response = await fetch('/api/tickets', {
				method: 'PUT',
				body: JSON.stringify({
					attribute,
					toChange: currAttr,
					ticketID: currSelectedTicket.ticketID
				})
			});
			if (response.ok) {
				error = false;
				feedbackToastMessage = 'Attributo cambiato';
				feedbackToastOpen = true;
			}

			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			attribute = '';
		}
	}
</script>

<svelte:head>
	<title>Biglietti</title>
</svelte:head>

{#if $user}
	<div class="mr-5 mt-5 grid w-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 px-5">
		<Label>
			Nome
			<Input bind:value={filters.name} placeholder="Mario" class="mt-1 w-full" />
		</Label>
		<Label>
			Cognome
			<Input bind:value={filters.surname} placeholder="Rossi" class="mt-1 w-full" />
		</Label>
		<Label>
			Codice Biglietto
			<Input bind:value={filters.ticketID} placeholder="FDP25-0000" class="mt-1 w-full" />
		</Label>
		<Label>
			Venditore
			<Input bind:value={filters.seller} placeholder="Marek" class="mt-1 w-full" />
		</Label>
	</div>

	<Hr class="mx-5 mt-5" />
	<div class="mx-5">
		<Table
			hoverable={true}
			divClass="tableDiv relative overflow-x-auto overflow-y-visible pb-40"
			class="relative overflow-visible overflow-x-auto rounded-md shadow-md sm:rounded-lg"
		>
			<TableHead>
				<TableHeadCell on:click={() => sortTable('ticketID')} class="cursor-pointer select-none">
					<div class="flex gap-1">
						Codice
						{#if $sortKey === 'ticketID'}
							<svelte:component
								this={$sortDirection > 0 ? ArrowDownAZ : ArrowUpAZ}
								class="ml-1 h-4 w-4"
							/>
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('name')} class="cursor-pointer select-none">
					<div class="flex gap-1">
						Nome
						{#if $sortKey === 'name'}
							<svelte:component
								this={$sortDirection > 0 ? ArrowDownAZ : ArrowUpAZ}
								class="ml-1 h-4 w-4"
							/>
						{:else}
							<div class="ml-1 h-4 w-4" />
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('surname')} class="cursor-pointer select-none">
					<div class="flex gap-1">
						Cognome
						{#if $sortKey === 'surname'}
							<svelte:component
								this={$sortDirection > 0 ? ArrowDownAZ : ArrowUpAZ}
								class="ml-1 h-4 w-4"
							/>
						{:else}
							<div class="ml-1 h-4 w-4" />
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('seller')} class="cursor-pointer select-none">
					<div class="flex gap-1">
						Venditore
						{#if $sortKey === 'seller'}
							<svelte:component
								this={$sortDirection > 0 ? ArrowDownAZ : ArrowUpAZ}
								class="ml-1 h-4 w-4"
							/>
						{:else}
							<div class="ml-1 h-4 w-4" />
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('soldAt')} class="cursor-pointer select-none">
					<div class="flex gap-1">
						Vendita
						{#if $sortKey === 'soldAt'}
							<svelte:component
								this={$sortDirection > 0 ? ArrowDown01 : ArrowUp01}
								class="ml-1 h-4 w-4"
							/>
						{:else}
							<div class="ml-1 h-4 w-4" />
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('checkIn')} class="cursor-pointer select-none">
					<div class="flex gap-1">
						Check-in
						{#if $sortKey === 'checkIn'}
							<svelte:component
								this={$sortDirection > 0 ? ArrowDown01 : ArrowUp01}
								class="ml-1 h-4 w-4"
							/>
						{:else}
							<div class="ml-1 h-4 w-4" />
						{/if}
					</div>
				</TableHeadCell>
			</TableHead>
			<TableBody tableBodyClass="divide-y">
				{#each $sortItems || [] as item}
					<TableBodyRow>
						<TableBodyCell
							tdClass="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-4"
						>
							<span class="mr-4">{item.ticketID}</span>
						</TableBodyCell>
						<TableBodyCell>
							{#if item.name}
								<div class="flex items-center">
									<span class="inline-block min-w-[100px]">{item.name}</span>
									<button
										class="ml-2"
										on:click={() => {
											triggerAttrModify(item, 'name');
										}}
									>
										<Pen class="w-4" />
									</button>
								</div>
							{:else}
								{'------'}
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							{#if item.surname}
								<div class="flex items-center">
									<span class="inline-block min-w-[100px]">{item.surname}</span>
									<button class="ml-2" on:click={() => triggerAttrModify(item, 'surname')}>
										<Pen class="w-4" />
									</button>
								</div>
							{:else}
								{'------'}
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							<div class="flex w-full items-center justify-between gap-3">
								{item.seller || '------'}
							</div>
						</TableBodyCell>
						<TableBodyCell>
							<span class="flex items-center gap-2">
								<Indicator color={item.soldAt ? 'green' : 'red'} />
								{formatDate(item.soldAt, 'Non venduto')}
							</span>
						</TableBodyCell>
						<TableBodyCell>
							<span class="flex items-center gap-2">
								<Indicator color={item.checkIn ? 'green' : 'yellow'} />
								<span class="w-max">{formatDate(item.checkIn, 'Non effettuato')}</span>
							</span>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</div>
{/if}

<FeedbackToast
	bind:open={feedbackToastOpen}
	bind:color
	bind:message={feedbackToastMessage}
	bind:icon={toastIcon}
/>
<Modal
	autoclose
	outsideclose
	bind:open={attrModalOpen}
	title={`Cambia il ${currAttr == 'name' ? 'nome' : 'cognome'} di ${currSelectedTicket?.name} ${currSelectedTicket?.surname}`}
	class="z-50"
>
	<span class="text-md"
		>Vuoi aggiornare il {currAttr == 'name' ? 'nome' : 'cognome'} di
		<b>{currSelectedTicket.name} {currSelectedTicket.surname}</b>?</span
	>
	<div class="flex flex-col gap-2">
		<span class="text-sm">Biglietto: {currSelectedTicket.ticketID}</span>
		<span class="text-sm">Nome: {currSelectedTicket.name}</span>
		<span class="text-sm">Cognome: {currSelectedTicket.surname}</span>
		<span class="text-sm">Venditore: {currSelectedTicket.seller}</span>
	</div>
	<Input bind:value={attribute} class="mt-4" placeholder={currSelectedTicket[currAttr]} />
	<svelte:fragment slot="footer">
		<Button on:click={() => handleAttrModify()}>Aggiorna</Button>
		<Button
			color="alternative"
			on:click={() => {
				attribute = '';
				attrModalOpen = false;
			}}
		>
			Annulla
		</Button>
	</svelte:fragment>
</Modal>
