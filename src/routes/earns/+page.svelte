<script lang="ts">
	import FeedbackToast from '$components/feedbacks/FeedbackToast.svelte';
	import type { User } from '$lib/auth/user';
	import { user } from '$store/store';
	import {
		Button,
		NumberInput,
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
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
				<TableHeadCell class="max-w-5 text-nowrap p-0"></TableHeadCell>
				<TableHeadCell
					class="sticky left-0 h-full cursor-pointer select-none text-nowrap bg-gray-50 dark:bg-gray-700"
					>Venditore</TableHeadCell
				>
				<TableHeadCell class="cursor-pointer select-none text-nowrap text-center"
					>Totale Venduto</TableHeadCell
				>
				<TableHeadCell class="cursor-pointer select-none text-nowrap text-center"
					>Da riscuotere</TableHeadCell
				>
				<TableHeadCell class="cursor-pointer select-none text-nowrap text-center"
					>Salda debito</TableHeadCell
				>
			</TableHead>
			<TableBody tableBodyClass="divide-y">
				{#each data.sellers || [] as item, index}
					<TableBodyRow class="w-full">
						<TableBodyCell class="bg-inherit p-0 pl-5">
							{#if index < 3}
								<!-- Classifica -->
								<span
									class="{index == 0
										? 'text-yellow-400'
										: index == 1
											? 'text-gray-400'
											: 'text-orange-500'} m-0 p-0 font-mono text-xl">#{index + 1}</span
								>
							{/if}
						</TableBodyCell>
						<TableBodyCell class="sticky left-0 z-10 bg-inherit">
							<span
								class="flex items-center gap-0 overflow-hidden font-medium md:gap-4 md:overflow-visible"
							>
								<div class="hidden md:block">
									{#if item.avatar_url}
										<img
											loading="lazy"
											src={item.avatar_url}
											alt={item.username[0]}
											class="h-7 w-7 rounded-full object-cover"
										/>
									{:else}
										<div
											class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-400 font-mono text-white"
										>
											<span>{item.username[0].toUpperCase()}</span>
										</div>
									{/if}
								</div>
								<span class="max-w-24 overflow-hidden overflow-ellipsis md:max-w-none"
									>{item.username}</span
								>
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
									class="z-[1] w-max text-center"
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

<FeedbackToast bind:open={changeToastOpen} bind:color bind:ToastIcon={toastIcon} bind:message />
