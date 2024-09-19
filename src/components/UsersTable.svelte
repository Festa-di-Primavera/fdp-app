<script lang="ts">
	import { addPermission, capitalizeFirstLetter, getStringFromEnumValue, hasPermission, intToBitArray, removePermission } from '$lib/utils';
	import {
		Badge,
		Checkbox,
		Button,
		Input,
		Popover,
		Radio,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Tooltip
	} from 'flowbite-svelte';
	import type { User } from 'lucia';
	import {
		ArrowDown01,
		ArrowDownAZ,
		ArrowUp01,
		ArrowUpAZ,
		Check,
		CheckCircle2,
		Euro,
		Filter,
		PenBox,
		Search,
		Ticket,
		Trash2,
		X,
		XCircle,
		Info,
		DoorOpen,
		Users,
		LayoutDashboard,
		Coins,
		ChefHat,
		DollarSign,
		ScanLine,
		Dna
	} from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import { UserPermissions } from '../models/permissions';
	import { user } from '../store/store';
	import FeedbackToast from './feedbacks/FeedbackToast.svelte';

	export let users: User[];

	export let currSelectedUser: User;
	export let currentBlocks: string[];

	export let aliasModalOpen: boolean;
	export let deleteModalOpen: boolean;
	export let debtModalOpen: boolean;
	export let blocksModalOpen: boolean;

	let color: 'green' | 'red' = 'green';
	let feedbackToastMessage: string = '';
	let error: boolean = false;
	let feedbackToastOpen: boolean = false;
	let timeOut: NodeJS.Timeout;

	// dropdown state variables
	let dropdownOpenMap: { [key: string]: boolean } = {};
	users?.forEach((user: User) => {
		dropdownOpenMap = { ...dropdownOpenMap, [user.id]: false };
	});

	// association between userpermissions and their respective icons
	const permissionIcons = {
		[UserPermissions.INFO_BIGLIETTO]: Info,
		[UserPermissions.CHECK_OUT]: DoorOpen,
		[UserPermissions.VENDITA]: DollarSign,
		[UserPermissions.CHECK_IN]: ScanLine,
		[UserPermissions.CUCINA]: ChefHat,
		[UserPermissions.CASSA]: Coins,
		[UserPermissions.DASHBOARD]: LayoutDashboard,
		[UserPermissions.LISTA_BIGLIETTI]: Ticket,
		[UserPermissions.UTENTI]: Users,
		[UserPermissions.GENERAZIONE]: Dna
	};

	function getPermissionIcon(permission: UserPermissions) {
		return permissionIcons[permission];
	}

	const handlePermissionChange = async (user: User, permission: UserPermissions, add: boolean) => {
		dropdownOpenMap = { ...dropdownOpenMap, [user.id]: false };

		try{
			const response = await fetch(
				`/api/permissions/${user.id}/${permission}`,
				{
					method: 'PUT',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify({add: add})
				},
			)
			
			if(response.ok){
				error = false;
				color = 'green';

				users = users.map((item: User) => {
					if (item.id === user.id) {
						item.permissions = add ? addPermission(user.permissions, permission) : removePermission(user.permissions, permission);
					}
					return item;
				});
				if($user?.id == user.id){
					$user.permissions = add ? addPermission($user.permissions, permission) : removePermission($user.permissions, permission);
				}
			}
			else{
				error = true;
				color = 'red';
			}
			
			feedbackToastMessage = (await response.json()).message;
			feedbackToastOpen = true;

			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
		}
		catch(e) {
			error = true;
			color = 'red';
			feedbackToastOpen = true;

			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);

			feedbackToastMessage = 'Errore di rete';
		}
	};

	const triggerAliasModal = async (user: User) => {
		currSelectedUser = user;
		aliasModalOpen = true;
	};

	const triggerDebtModal = async (user: User) => {
		currSelectedUser = user;
		debtModalOpen = true;
	};

	const triggerBlocksModal = async (user: User) => {
		currSelectedUser = user;
		const response = await fetch(`/api/tickets/blocks/${user.id}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
				/* 'Authorization': `Bearer ${loginToken}` */
			}
		});
		if (response.ok) {
			currentBlocks = (await response.json()).blocks;
			blocksModalOpen = true;
		} else {
			error = true;
			color = 'red';
			feedbackToastOpen = true;

			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);

			feedbackToastMessage = 'Errore nella lettura dei blocchetti';
		}
	};

	// search and filter variables
	let searchTerm = '';
	let filter = 'nome';
	let filteredItems: User[] = [];

	const sortKey = writable('username'); // username, email, alias, owned_money, total_from_sales
	const sortDirection = writable(1);
	const sortItems = writable<User[]>(filteredItems.slice());

	const sortTable = (key: string) => {
		if ($sortKey === key) {
			sortDirection.update((val) => -val);
		} else {
			sortKey.set(key);
			sortDirection.set(1);
		}
	};

	$: {
		filteredItems = users?.filter((item: User) => {
			if (filter === 'nome')
				return item.username.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
			else if (filter === 'email')
				return item.email?.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
			else if (filter === 'alias')
				return item.alias.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
			else return true;
		});

		const key = $sortKey;
		const direction = $sortDirection;
		sortItems.set(filteredItems);

		if ($sortItems?.length > 0) {
			const sorted = [...$sortItems].sort((a, b) => {
				let aVal: any;
				let bVal: any;

				if (key == 'alias' || key == 'owned_money' || key == 'total_from_sales') {
					aVal = a[key] || 0;
					bVal = b[key] || 0;
				} else if (key == 'username' || key == 'email' || key == 'email_verified') {
					aVal = a[key];
					bVal = b[key];
				}

				if (aVal < bVal) {
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

	let totalToClaim = users?.reduce((acc: number, curr: User) => acc + (curr.owned_money || 0), 0);
	let totalProfit = users?.reduce(
		(acc: number, curr: User) => acc + (curr.total_from_sales || 0),
		0
	);
</script>

{#if $user}
	<div class="mx-5 mt-5">
		<Input placeholder={`Cerca per ${filter}`} bind:value={searchTerm}>
			<Search slot="left" />
			<button slot="right">
				<Filter />
				<Popover placement="bottom-end" class="z-50 p-0" defaultClass="pt-2">
					Filtra per
					<ul class="w-48 divide-y divide-gray-200 dark:divide-gray-600">
						<li><Radio class="p-3" bind:group={filter} value="nome">Nome</Radio></li>
						<li><Radio class="p-3" bind:group={filter} value="email">E-Mail</Radio></li>
						<li><Radio class="p-3" bind:group={filter} value="alias">Alias</Radio></li>
					</ul>
				</Popover>
			</button>
		</Input>
	</div>
	<div class="mx-5 mt-5">
		<Table
			divClass="tableDiv relative overflow-x-auto overflow-y-visible pb-40"
			class="relative overflow-visible overflow-x-auto rounded-md shadow-md sm:rounded-lg"
		>
			<TableHead>
				<TableHeadCell on:click={() => sortTable('username')} class="cursor-pointer select-none">
					<div class="flex gap-1">
						Nome
						{#if $sortKey === 'username'}
							<svelte:component
								this={$sortDirection > 0 ? ArrowDownAZ : ArrowUpAZ}
								class="ml-1 h-4 w-4"
							/>
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('email')} class="cursor-pointer select-none">
					<div class="flex gap-1">
						Email
						{#if $sortKey === 'email'}
							<svelte:component
								this={$sortDirection > 0 ? ArrowDownAZ : ArrowUpAZ}
								class="ml-1 h-4 w-4"
							/>
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell class="cursor-pointer select-none">
					<div class="flex gap-1">Permessi</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('alias')} class="cursor-pointer select-none">
					<div class="flex justify-center gap-1">
						Alias
						{#if $sortKey === 'alias'}
							<svelte:component
								this={$sortDirection > 0 ? ArrowDownAZ : ArrowUpAZ}
								class="ml-1 h-4 w-4"
							/>
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('owned_money')} class="cursor-pointer select-none">
					<div class="flex justify-center gap-1">
						Debito (€)
						{#if $sortKey === 'owned_money'}
							<svelte:component
								this={$sortDirection > 0 ? ArrowDown01 : ArrowUp01}
								class="ml-1 h-4 w-4"
							/>
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell
					on:click={() => sortTable('total_from_sales')}
					class="max-w-[8.5rem] cursor-pointer select-none"
				>
					<div class="justify-left flex gap-1">
						Tot. Vendite (€)
						{#if $sortKey === 'total_from_sales'}
							<svelte:component
								this={$sortDirection > 0 ? ArrowDown01 : ArrowUp01}
								class="ml-1 h-4 w-4"
							/>
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell class="max-w-20 px-0 text-center">Blocchetti</TableHeadCell>
				{#if $user.email === import.meta.env.VITE_ADMIN_EMAIL1 || $user.email === import.meta.env.VITE_ADMIN_EMAIL2}
					<TableHeadCell class="text-center">Elimina</TableHeadCell>
				{/if}
			</TableHead>
			<TableBody tableBodyClass="divide-y">
				{#each $sortItems || [] as item}
					<TableBodyRow class="w-full">
						<TableBodyCell>
							<span class="flex items-center gap-4 font-medium">
								{#if item.avatar_url}
									<img src={item.avatar_url} alt={item.username[0]} class="h-7 w-7 rounded-full" />
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
						<TableBodyCell>
							<span class="flex items-center gap-2">
								{#if item.avatar_url}
									<img class="w-5" alt="Google" src="/google.svg" />
									<Tooltip>Google</Tooltip>
								{:else}
									<svelte:component
										this={item.email_verified ? Check : X}
										color={item.email_verified ? 'green' : 'red'}
										class="w-5"
									/>
									<Tooltip>{(item.email_verified ? '' : 'Non ') + 'Verificata'}</Tooltip>
								{/if}
								{item.email}
							</span>
						</TableBodyCell>
						<TableBodyCell>
							<div class="grid grid-cols-5 gap-2 min-w-28">
								{#each intToBitArray(item.permissions, Object.keys(UserPermissions).length / 2).reverse() as perm, index}
									<button on:click={() => handlePermissionChange(item, Math.pow(2, index), !perm)}>
										<svelte:component this={getPermissionIcon(Math.pow(2, index))} class={`w-4 ${perm ? "text-primary-300" : "text-slate-500"}`} />
									</button>
									<Tooltip color="primary" border>
										{
											capitalizeFirstLetter(getStringFromEnumValue(UserPermissions, Math.pow(2, index))
											.toLowerCase()
											.replace('_', ' '))
										}
									</Tooltip>
								{/each}
							</div>
						</TableBodyCell>
						<TableBodyCell>
							<div class="flex w-full items-center justify-between gap-3">
								{item.alias}
								<button on:click={() => triggerAliasModal(item)}>
									<PenBox class="h-5 w-5" />
								</button>
							</div>
						</TableBodyCell>
						<TableBodyCell class="min-w-52 max-w-64">
							<div class="flex w-full items-center justify-around">
								<span class="w-12 text-right">{item.owned_money || 0},00</span>
								<Button
									disabled={!item.owned_money}
									size="xs"
									class="flex items-center gap-1"
									on:click={() => triggerDebtModal(item)}
								>
									<Euro class="h-4 w-4" /> Salda
								</Button>
							</div>
						</TableBodyCell>
						<TableBodyCell class="max-w-40">
							<span class="w-max">{item.total_from_sales || 0},00</span>
						</TableBodyCell>
						<TableBodyCell>
							<div class="grid w-full place-items-center">
								<Button
									disabled={!hasPermission(item.permissions, UserPermissions.VENDITA)}
									class="mx-auto bg-primary-500 px-2 py-1 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
									on:click={() => triggerBlocksModal(item)}
								>
									<Ticket class="aspect-square w-4 text-gray-900 dark:text-white" />
								</Button>
							</div>
						</TableBodyCell>
						{#if $user.email === import.meta.env.VITE_ADMIN_EMAIL1 || $user.email === import.meta.env.VITE_ADMIN_EMAIL2}
							<TableBodyCell>
								<div class="grid w-full place-items-center">
									<Button
										disabled={item.email === import.meta.env.VITE_ADMIN_EMAIL1 ||
											item.email === import.meta.env.VITE_ADMIN_EMAIL2}
										class="bg-red-500 px-2 py-1 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600"
										on:click={() => {
											currSelectedUser = item;
											deleteModalOpen = true;
										}}
									>
										<Trash2 class="aspect-square w-4 text-gray-900 dark:text-white" />
									</Button>
								</div>
							</TableBodyCell>
						{/if}
					</TableBodyRow>
				{/each}
				<TableBodyRow>
					<!-- 4 empty table body cells -->
					<TableBodyCell></TableBodyCell>
					<TableBodyCell></TableBodyCell>
					<TableBodyCell></TableBodyCell>
					<TableBodyCell></TableBodyCell>
					<TableBodyCell>
						<div class="flex w-full items-center justify-center">
							<span class="text-left">{totalToClaim},00 €</span>
						</div>
					</TableBodyCell>
					<TableBodyCell>
						<div class="justify-left flex w-full items-center">
							<span class="text-left">{totalProfit},00 €</span>
						</div>
					</TableBodyCell>
					<TableBodyCell></TableBodyCell>
					{#if $user.email === import.meta.env.VITE_ADMIN_EMAIL1 || $user.email === import.meta.env.VITE_ADMIN_EMAIL2}
						<TableBodyCell></TableBodyCell>
					{/if}
				</TableBodyRow>
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
