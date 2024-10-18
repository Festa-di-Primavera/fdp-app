<script lang="ts">
	import FeedbackToast from '$components/feedbacks/FeedbackToast.svelte';
	import type { User } from '$lib/auth/user';
	import { user } from '$store/store';
	import {
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Button,
		NumberInput,
		Card
	} from 'flowbite-svelte';
	import { CheckCircle2, XCircle } from 'lucide-svelte';

	export let data: {
		user: User;
		sellers: User[];
	};

	if (!$user) $user = data.user;

	// changes toast variables
	let changeToastOpen: boolean = false;
	let color: 'green' | 'red' = 'green';
	let message: string = '';
	let error: boolean = false;
	let timeOut: NodeJS.Timeout;
	$: toastIcon = error ? XCircle : CheckCircle2;

	const debtToClaimMap: { [key: string]: number } = {};
	const claimMoney = async (selectedUser: User) => {
		const debtToClaim = debtToClaimMap[selectedUser.id];
		if (debtToClaim <= 0 || isNaN(debtToClaim) || debtToClaim > selectedUser.owned_money) {
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
			const resp = await fetch(`/api/money/${selectedUser.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ money: debtToClaim })
			});

			if (resp.ok) {
				data.sellers = data.sellers.map((item: User) => {
					if (item.id === selectedUser.id) {
						item.owned_money -= debtToClaim;
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
		debtToClaimMap[selectedUser.id] = 0;
	};
</script>

<svelte:head>
	<title>Gestione Denaro</title>
</svelte:head>

{#if $user}
	<div class="mx-5 mt-5">
		<Table
			divClass="tableDiv relative overflow-x-auto overflow-y-visible"
			class="relative overflow-visible overflow-x-auto rounded-md shadow-md sm:rounded-lg"
		>
			<TableHead>
				<TableHeadCell class="p-0 max-w-5"></TableHeadCell>
				<TableHeadCell
					class="sticky left-0 h-full cursor-pointer select-none bg-gray-50 dark:bg-gray-700"
					>Venditore</TableHeadCell
				>
				<TableHeadCell class="cursor-pointer select-none text-center">Totale Venduto</TableHeadCell>
				<TableHeadCell class="cursor-pointer select-none text-center">Da riscuotere</TableHeadCell>
				<TableHeadCell class="cursor-pointer select-none text-center">Salda debito</TableHeadCell>
			</TableHead>
			<TableBody tableBodyClass="divide-y">
				{#each data.sellers || [] as item, index}
					<TableBodyRow class="w-full">
						<TableBodyCell class="sticky left-0 bg-inherit p-0 pl-5">
							{#if index < 3}
								<!-- Classifica -->
								<span
									class="{index == 0
										? 'text-yellow-400'
										: index == 1
											? 'text-gray-400'
											: 'text-orange-500'} p-0 m-0 font-mono text-xl">#{index + 1}</span
								>
							{/if}
						</TableBodyCell>
						<TableBodyCell class="sticky left-0 bg-inherit">
							<span class="flex items-center gap-4 font-medium">
								{#if item.avatar_url}
									<img
										loading="lazy"
										src={item.avatar_url}
										alt={item.username[0]}
										class="h-7 w-7 rounded-full"
									/>
								{:else}
									<div
										class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-400 font-mono text-white"
									>
										<span>{item.username[0].toUpperCase()}</span>
									</div>
								{/if}
								<span class="mr-4">{item.username}</span>
							</span>
						</TableBodyCell>
						<TableBodyCell class="text-center">
							€ {item.total_from_sales}
						</TableBodyCell>
						<TableBodyCell class="text-center">
							€ {item.owned_money}
						</TableBodyCell>
						<TableBodyCell class="text-center">
							<div class="flex w-full items-center justify-center gap-4">
								<NumberInput
									min="1"
									max={item.owned_money}
									bind:value={debtToClaimMap[item.id]}
									class="w-24 text-center"
									disabled={item.owned_money === 0}
								/>
								<span class="text-nowrap">su € {item.owned_money}</span>
								<Button
									class="ml-2"
									on:click={() => claimMoney(item)}
									disabled={item.owned_money === 0}>Salda</Button
								>
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</div>
{:else}
	<div class="mt-10 flex w-full flex-grow flex-col items-center justify-center gap-5">
		<Spinner size="sm" class="max-w-12 self-center" />
		<span class="text-2xl font-semibold text-primary-600">Attendere...</span>
	</div>
{/if}

<FeedbackToast bind:open={changeToastOpen} bind:color bind:icon={toastIcon} bind:message />
