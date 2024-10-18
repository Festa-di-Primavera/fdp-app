<script lang="ts">
	import type { User } from '$lib/auth/user';
	import { getStringFromEnumValue } from '$lib/utils/enums';
	import { addPermission, intToBitArray, removePermission } from '$lib/utils/permissions';
	import { capitalizeFirstLetter } from '$lib/utils/textFormat';
	import { UserPermissions } from '$models/permissions';
	import { user } from '$store/store';
	import {
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
	import {
		ArrowDownAZ,
		ArrowUpAZ,
		Check,
		CheckCircle2,
		ChefHat,
		Coins,
		Dna,
		DollarSign,
		DoorOpen,
		Filter,
		Info,
		LayoutDashboard,
		PenBox,
		ScanLine,
		Search,
		Ticket,
		Trash2,
		Users,
		X,
		XCircle
	} from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import FeedbackToast from './feedbacks/FeedbackToast.svelte';

	export let users: User[];

	export let currSelectedUser: User;

	export let aliasModalOpen: boolean;
	export let deleteModalOpen: boolean;

	let color: 'green' | 'red' = 'green';
	let feedbackToastMessage: string = '';
	let error: boolean = false;
	let feedbackToastOpen: boolean = false;
	let timeOut: NodeJS.Timeout;
	$: toastIcon = error ? XCircle : CheckCircle2;

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

		try {
			const response = await fetch(`/api/permissions/${user.id}/${permission}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ add: add })
			});

			if (response.ok) {
				error = false;
				color = 'green';

				users = users.map((item: User) => {
					if (item.id === user.id) {
						item.permissions = add
							? addPermission(user.permissions, permission)
							: removePermission(user.permissions, permission);
					}
					return item;
				});
				if ($user?.id == user.id) {
					$user.permissions = add
						? addPermission($user.permissions, permission)
						: removePermission($user.permissions, permission);
				}
			} else {
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
		} catch (e) {
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

	// search and filter variables
	let searchTerm = '';
	let filter = 'nome';
	let filteredItems: User[] = [];

	const sortKey = writable('username'); // username, email, alias
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

				if (key == 'alias') {
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
				<TableHeadCell class="text-center">Elimina</TableHeadCell>
			</TableHead>
			<TableBody tableBodyClass="divide-y">
				{#each $sortItems || [] as item}
					<TableBodyRow class="w-full">
						<TableBodyCell>
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
							<div class="grid min-w-28 grid-cols-5 gap-2">
								{#each intToBitArray(item.permissions, Object.keys(UserPermissions).length / 2).reverse() as perm, index}
									<button on:click={() => handlePermissionChange(item, Math.pow(2, index), !perm)}>
										<svelte:component
											this={getPermissionIcon(Math.pow(2, index))}
											class={`w-4 ${perm ? 'text-primary-300' : 'text-slate-500'}`}
										/>
										<Tooltip color="primary" border>
											{capitalizeFirstLetter(
												getStringFromEnumValue(UserPermissions, Math.pow(2, index))
													.toLowerCase()
													.replace('_', ' ')
											)}
										</Tooltip>
									</button>
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
						<TableBodyCell>
							<div class="grid w-full place-items-center">
								<Button
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
