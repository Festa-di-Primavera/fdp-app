<script lang="ts">
	import { Button, Input, Label, Modal, NumberInput, Spinner, Toggle } from 'flowbite-svelte';
	import { CheckCircle2, Ticket, XCircle } from 'lucide-svelte';

	import type { User } from "$lib/auth/user";
	import UsersTable from '$components/UsersTable.svelte';
	import FeedbackToast from '$components/feedbacks/FeedbackToast.svelte';
	import { user } from '$store/store.js';
	import { intToBitArray } from '$lib/utils/permissions';
	import { getStringFromEnumValue } from '$lib/utils/enums';
	import { UserPermissions } from '$models/permissions';

	export let data: {
		user: User;
		usersList: User[];
	};
	if (!$user) $user = data.user;

	// fetch all users
	let users = data.usersList;

	// modal state variable
	let deleteModalOpen: boolean = false;

	// changes toast variables
	let changeToastOpen: boolean = false;
	let color: 'green' | 'red' = 'green';
	let message: string = '';
	let error: boolean = false;
	let timeOut: NodeJS.Timeout;

	// function to handle user delete
	const handleUserDelete = async (user: User) => {
		try {
			let res = await fetch(`/api/users/${user.id}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});

			if (res.ok) {
				error = false;
				color = 'green';
				users = users.filter((item: User) => item.id !== user.id);
			} else if (res.status === 404) {
				error = true;
				color = 'red';
				users = users.filter((item: User) => item.id !== user.id);
			} else {
				error = true;
				color = 'red';
			}

			message = (await res.json()).message;
			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
		} catch (e) {
			error = true;
			color = 'red';
			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			message = 'Errore di rete';
		}
	};

	let debtModalOpen: boolean = false;
	let debtPay: number = 0;
	let payMax: boolean = false;

	const claimMoney = async (user: User) => {
		if (debtPay <= 0 || isNaN(debtPay) || debtPay > currSelectedUser.owned_money) {
			error = true;
			color = 'red';
			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			message = 'Importo non valido';
			return;
		}

		try {
			const resp = await fetch(`/api/money/${user.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ money: debtPay })
			});

			if (resp.ok) {
				users = users.map((item: User) => {
					if (item.id === user.id) {
						item.owned_money -= debtPay;
					}
					return item;
				});
				error = false;
				color = 'green';
			} else {
				error = true;
				color = 'red';
			}

			message = (await resp.json()).message;
			changeToastOpen = true;

			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
		} catch (e) {
			error = true;
			color = 'red';
			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			message = 'Errore di rete';
		}
		debtModalOpen = false;
		debtPay = 0;
		payMax = false;
	};

	// alias modal state variables
	let aliasModalOpen: boolean = false;
	let alias: string = '';

	// current selected user state variable
	let currSelectedUser: User;

	const handleAliasChange = async (user: User) => {
		if (alias !== null && alias != '' && alias != user.alias) {
			const res = await fetch(`/api/alias/${user.id}/${alias}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' }
			});

			if (res.ok) {
				color = 'green';
				error = false;
				users = users.map((item: User) => {
					if (item.id === user.id) {
						item.alias = alias;
					}
					return item;
				});
			} else {
				color = 'red';
				error = true;
			}

			if (res.status === 404) {
				users = users.filter((item: User) => item.id !== user.id);
			}

			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			message = (await res.json()).message;
		}

		aliasModalOpen = false;
		alias = '';
	};

	let blocksModalOpen: boolean = false;
	let currentBlocks: string[] = [];
	let ticketCode: string = '';
	
	$: toastIcon = error ? XCircle : CheckCircle2;
</script>

<svelte:head>
	<title>Utenti</title>
</svelte:head>

{#if $user}
	<UsersTable
		bind:users
		bind:currSelectedUser
		bind:aliasModalOpen
		bind:deleteModalOpen
		bind:debtModalOpen
		bind:blocksModalOpen
		bind:currentBlocks
	/>
	{#if currSelectedUser !== undefined}
		<Modal title={`Elimina ${currSelectedUser.username}`} bind:open={deleteModalOpen} class="z-50">
			<span class="text-md">Vuoi eliminare l'utente <b>{currSelectedUser.username}</b>?</span>
			<div class="flex flex-col gap-2">
				<span class="text-sm">UID: {currSelectedUser.id}</span>
				<span class="text-sm">Nome: {currSelectedUser.username}</span>
				<span class="text-sm">E-mail: {currSelectedUser.email}</span>
				<span class="text-sm"
					>Permessi:
					{intToBitArray(currSelectedUser.permissions, Object.keys(UserPermissions).length / 2)
						.filter((item) => item)
						.map((item, index) => getStringFromEnumValue(UserPermissions, Math.pow(2, index)))
						.join(', ')}
				</span>
				<span class="text-sm">Alias: {currSelectedUser.alias}</span>
			</div>
			<svelte:fragment slot="footer">
				<Button
					class="bg-red-500 dark:bg-red-500"
					on:click={() => {
						handleUserDelete(currSelectedUser);
						deleteModalOpen = false;
					}}
				>
					Elimina
				</Button>
				<Button color="alternative" on:click={() => (deleteModalOpen = false)}>Annulla</Button>
			</svelte:fragment>
		</Modal>
		<Modal
			bind:open={aliasModalOpen}
			title={`Aggiorna l'alias di ${currSelectedUser.username}`}
			class="z-50"
		>
			<span class="text-md">Vuoi aggiornare l'alias di <b>{currSelectedUser.username}</b>?</span>
			<div class="flex flex-col gap-2">
				<span class="text-sm">UID: {currSelectedUser.id}</span>
				<span class="text-sm">Nome: {currSelectedUser.username}</span>
				<span class="text-sm">E-mail: {currSelectedUser.email}</span>
				<span class="text-sm"
					>Permessi:
					{intToBitArray(currSelectedUser.permissions, Object.keys(UserPermissions).length / 2)
						.filter((item) => item)
						.map((item, index) => getStringFromEnumValue(UserPermissions, Math.pow(2, index)))
						.join(', ')}
				</span>
				<span class="text-sm">Alias: {currSelectedUser.alias}</span>
			</div>
			<Input bind:value={alias} class="mt-4" />
			<svelte:fragment slot="footer">
				<Button on:click={() => handleAliasChange(currSelectedUser)}>Aggiorna</Button>
				<Button
					color="alternative"
					on:click={() => {
						alias = '';
						aliasModalOpen = false;
					}}
				>
					Annulla
				</Button>
			</svelte:fragment>
		</Modal>
		<Modal
			bind:open={debtModalOpen}
			title={`Salda il debito di ${currSelectedUser.username}`}
			class="z-50"
		>
			<span class="text-md">Vuoi saldare il debito di <b>{currSelectedUser.username}</b>?</span>
			<div class="flex flex-col gap-2">
				<span class="text-sm">UID: {currSelectedUser.id}</span>
				<span class="text-sm">Nome: {currSelectedUser.username}</span>
				<span class="text-sm">E-mail: {currSelectedUser.email}</span>
				<span class="text-sm"
					>Permessi:
					{intToBitArray(currSelectedUser.permissions, Object.keys(UserPermissions).length / 2)
						.filter((item) => item)
						.map((item, index) => getStringFromEnumValue(UserPermissions, Math.pow(2, index)))
						.join(', ')}
				</span>
				<span class="text-sm">Alias: {currSelectedUser.alias}</span>
			</div>
			<div class="justify-left mt-4 flex items-center gap-2">
				<NumberInput
					min="1"
					max={currSelectedUser.owned_money}
					bind:value={debtPay}
					class="w-24 text-center"
					bind:disabled={payMax}
				/>
				<span class="text-nowrap">su {currSelectedUser.owned_money}€</span>
			</div>
			<Toggle
				bind:checked={payMax}
				on:click={() => {
					if (!payMax) debtPay = currSelectedUser?.owned_money ?? 0;
				}}
				class="w-max">Salda tutto</Toggle
			>
			<svelte:fragment slot="footer">
				<Button on:click={() => claimMoney(currSelectedUser)}>Salda</Button>
				<Button
					color="alternative"
					on:click={() => {
						debtModalOpen = false;
						debtPay = 0;
					}}
				>
					Annulla
				</Button>
			</svelte:fragment>
		</Modal>
		<Modal
			bind:open={blocksModalOpen}
			title={`Blocchetti assegnati a ${currSelectedUser.username}`}
			class="z-50"
			outsideclose
			autoclose
			on:close={() => (ticketCode = '')}
		>
			<span class="text-md">
				{#if currentBlocks.length > 0}
					Blocchetti di
				{/if}
				<b>{currSelectedUser.username}</b>
				{#if currentBlocks.length == 0}
					non ha blocchetti assegnati
				{/if}
			</span>
			{#if currentBlocks.length > 0}
				<div class="flex flex-col gap-2">
					{#each currentBlocks as block}
						<span class="text-sm"> - {block}</span>
					{/each}
				</div>
			{/if}
			<div>
				<Label class="text-md w-full font-medium text-black dark:text-white">
					<div class="mb-2 flex flex-col">
						Codice Blocco
						<span class="text-xs font-normal text-gray-500"
							>(biglietto qualsiasi del blocchetto)</span
						>
					</div>
					<div class="flex w-full items-center justify-center gap-6">
						<Input bind:value={ticketCode} autocomplete="off" placeholder="XNRF 45151">
							<Ticket slot="left" class="h-6 w-6 text-primary-600 dark:text-white" />
						</Input>
						<Button
							on:click={() => {
								//addBlock(ticketCode, currSelectedUser.uid);
							}}
						>
							Aggiungi
						</Button>
					</div>
				</Label>
			</div>
		</Modal>
	{/if}
{:else}
	<div class="mt-10 flex w-full flex-grow flex-col items-center justify-center gap-5">
		<Spinner size="sm" class="max-w-12 self-center" />
		<span class="text-2xl font-semibold text-primary-600">Attendere...</span>
	</div>
{/if}

<FeedbackToast bind:open={changeToastOpen} bind:color bind:icon={toastIcon} bind:message />
