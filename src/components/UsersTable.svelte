<script lang="ts">
	import { Button, Dropdown, DropdownItem, Input, Popover, Radio, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Toast } from "flowbite-svelte";
	import { CheckCircle2, ChevronsUpDown, Filter, PenBox, Search, Trash2, XCircle, ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowDown10, ArrowUp01, ArrowUp10, Euro } from "lucide-svelte";
	import { Role } from "../models/role";
	import { user } from "../store/store";
	import { writable } from 'svelte/store';
	import SignInToast from "./feedbacks/SignInToast.svelte";
	import FeedbackToast from "./feedbacks/FeedbackToast.svelte";
	
	export let users: any;
	export let currSelectedUser: any | undefined;
	export let aliasModalOpen: boolean;
	export let deleteModalOpen: boolean;
	export let debtModalOpen: boolean;

	let color: 'green' | 'red' = 'green';
	let feedbackToastMessage: string = '';
	let error: boolean = false;
	let feedbackToastOpen: boolean = false;
	let timeOut: NodeJS.Timeout;
	
	// dropdown state variables
	let dropdownOpenMap: { [key: string]: boolean } = {};
	users?.forEach((user: any) => {
		dropdownOpenMap = {...dropdownOpenMap, [user.uid]: false}
	});

	let enumBindings: {[key: string]: Role} = {
		'normal': Role.NORMAL,
		'seller': Role.SELLER,
		'check-in': Role.CHECKIN,
		'admin': Role.ADMIN,
		'superadmin': Role.SUPERADMIN
	};

	const handleRoleChange = async (user: any, role: string) => {
		let roleEnum = enumBindings[role];
		dropdownOpenMap = { ...dropdownOpenMap, [user.uid]: false };

		if (user.customClaims?.role !== role){
			try{
				const response = await fetch(`/api/role/${user.uid}/${role}`, {method: 'PUT', headers: {'Content-Type': 'application/json'}})
				
				if(response.ok){
					error = false;
					color = 'green';

					users = users.map((item: any) => {
						if (item.uid === user.uid) {
							if(item.customClaims){
								item.customClaims.role = role
								item.customClaims.accessLevel = roleEnum;
							}
							else{
								item.customClaims = {...item.customClaims, role: role, accessLevel: roleEnum};
							}
						}
						return item;
					});
					if($user?.uid == user.uid){
						$user?.reload();
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
		}
	};

	const triggerAliasModal = async (user: any) => {
		currSelectedUser = user;
		aliasModalOpen = true;
	};

	const triggerDebtModal = async (user: any) => {
		currSelectedUser = user;
		debtModalOpen = true;
	};

	// search and filter variables
	let searchTerm = '';
	let filter = 'nome';
	let filteredItems: any[] = [];

	const sortKey = writable('displayName'); // displayName, email, role, alias
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

	$: {
		filteredItems = (users?.filter((item: any) => {
			if (filter === 'nome')
				return item.displayName?.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
			else if (filter === 'email')
				return item.email?.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
			else if (filter === 'ruolo')
				return item.customClaims?.role.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
			else if (filter === 'alias')
				return item.customClaims?.alias.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
			else return true;
		}));
		
		const key = $sortKey;
		const direction = $sortDirection;
		sortItems.set(filteredItems);
		
		if($sortItems?.length > 0) {
			const sorted = [...$sortItems].sort((a, b) => {

				let aVal;
				let bVal;

				if(key == "alias" || key == "money" || key == "totMoney"){
					aVal = a.customClaims[key] || 0;
					bVal = b.customClaims[key] || 0;
				} else if(key == "role"){
					aVal = a.customClaims?.accessLevel;
					bVal = b.customClaims?.accessLevel;
				}else {
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
						<li><Radio class="p-3" bind:group={filter} value="ruolo">Ruolo</Radio></li>
						<li><Radio class="p-3" bind:group={filter} value="alias">Alias</Radio></li>
					</ul>
				</Popover>
			</button>
		</Input>
	</div>
	<div class="mx-5 mt-5">
		<Table hoverable={true} divClass="tableDiv relative overflow-x-auto overflow-y-visible pb-40" class="relative overflow-x-auto rounded-md shadow-md sm:rounded-lg overflow-visible ">
			<TableHead>
				<TableHeadCell on:click={() => sortTable('displayName')} class="cursor-pointer select-none">
					<div class="flex gap-1">
						Nome
						{#if $sortKey === 'displayName'}
							<svelte:component this={$sortDirection > 0 ? ArrowDownAZ : ArrowUpAZ} class="w-4 h-4 ml-1" />
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('email')} class="cursor-pointer select-none">
					<div class="flex gap-1">
						Email
						{#if $sortKey === 'email'}
							<svelte:component this={$sortDirection > 0 ? ArrowDownAZ : ArrowUpAZ} class="w-4 h-4 ml-1" />
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('role')} class="cursor-pointer select-none">
					<div class="flex gap-1">
						Ruolo
						{#if $sortKey === 'role'}
							<svelte:component this={$sortDirection > 0 ? ArrowDownAZ : ArrowUpAZ} class="w-4 h-4 ml-1" />
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('alias')} class="cursor-pointer select-none">
					<div class="flex gap-1 justify-center">
						Alias
						{#if $sortKey === 'alias'}
							<svelte:component this={$sortDirection > 0 ? ArrowDownAZ : ArrowUpAZ} class="w-4 h-4 ml-1" />
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('money')} class="cursor-pointer select-none">
					<div class="flex gap-1 justify-center">
						Debito (€)
						{#if $sortKey === 'money'}
							<svelte:component this={$sortDirection > 0 ? ArrowDown01 : ArrowUp01} class="w-4 h-4 ml-1" />
						{/if}
					</div>
				</TableHeadCell>
				<TableHeadCell on:click={() => sortTable('totMoney')} class="cursor-pointer select-none max-w-[8.5rem]">
					<div class="flex gap-1 justify-left">
						Tot. Vendite (€)
						{#if $sortKey === 'totMoney'}
							<svelte:component this={$sortDirection > 0 ? ArrowDown01 : ArrowUp01} class="w-4 h-4 ml-1" />
						{/if}
					</div>
				</TableHeadCell>
				{#if $user.email === import.meta.env.VITE_ADMIN_EMAIL1 || $user.email === import.meta.env.VITE_ADMIN_EMAIL2}
					<TableHeadCell class="text-center">Elimina</TableHeadCell>
				{/if}
			</TableHead>
			<TableBody tableBodyClass="divide-y">
				{#each $sortItems || [] as item}
					<TableBodyRow>
						<TableBodyCell tdClass="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-4">
							<div style="background: {item.customClaims?.color};" class="h-7 w-7 rounded-full flex items-center justify-center text-white" >
								{item.displayName?.charAt(0).toUpperCase() || 'U'}
							</div>
							<span class="mr-4">{item.displayName}</span>
						</TableBodyCell>
						<TableBodyCell>{item.email}</TableBodyCell>
						<TableBodyCell>
							{#if item.email === import.meta.env.VITE_ADMIN_EMAIL1 || item.email === import.meta.env.VITE_ADMIN_EMAIL2 || item.uid === $user?.uid}
								<span class="text-gray-400 dark:text-gray-500 cursor-not-allowed">{item.customClaims?.role ? item.customClaims?.role.toUpperCase() : 'NORMAL'}</span>
							{:else}
								<button class="flex w-[8.25rem] justify-between border-gray-200 border-[1px] rounded-md px-2 py-1">
									{item.customClaims?.role ? item.customClaims?.role.toUpperCase() : 'NORMAL'}
									<ChevronsUpDown class="aspect-square w-4" />
								</button>
								<Dropdown placement="bottom" class="z-[100] dark:bg-gray-700 rounded-lg" bind:open={dropdownOpenMap[item.uid]}>
									{#each Object.keys(Role).filter((v) => isNaN(Number(v))) as role}
										<DropdownItem class={item.customClaims?.role === role.toLowerCase() ? `text-primary-500` : ''}>
											<button class="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]" on:click={() => handleRoleChange(item, role.toLowerCase())}> {role.toUpperCase()} </button>
										</DropdownItem>
									{/each}
								</Dropdown>
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							<div class="flex gap-3 w-full justify-between items-center">
								{item.customClaims?.alias}
								<button on:click={() => triggerAliasModal(item)}>
									<PenBox class="w-5 h-5" />
								</button>
							</div>
						</TableBodyCell>
						<TableBodyCell class="min-w-52 max-w-64">
							<div class="flex w-full justify-around items-center">
								<span class="text-right w-12">{item.customClaims?.money || 0},00</span>
								<Button disabled={!item.customClaims?.money} size="xs" class="flex items-center gap-1" on:click={()=>triggerDebtModal(item)}>
									<Euro class="w-4 h-4" /> Salda
								</Button>
							</div>
						</TableBodyCell>
						<TableBodyCell class="max-w-40">
							<span class="w-max">{item.customClaims?.totMoney || 0},00</span>
						</TableBodyCell>
						{#if $user.email === import.meta.env.VITE_ADMIN_EMAIL1 || $user.email === import.meta.env.VITE_ADMIN_EMAIL2}
							<TableBodyCell class="flex items-center justify-center">
								<Button disabled={item.email === import.meta.env.VITE_ADMIN_EMAIL1 || item.email === import.meta.env.VITE_ADMIN_EMAIL2} class="px-2 py-1 dark:bg-red-500 bg-red-500 hover:bg-red-600 dark:hover:bg-red-600" on:click={()=> {currSelectedUser=item; deleteModalOpen = true; }}>
									<Trash2 class="aspect-square w-4 dark:text-white text-gray-900" />
								</Button>
							</TableBodyCell>
						{/if}
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</div>
{/if}

<FeedbackToast bind:open={feedbackToastOpen} bind:color bind:message={feedbackToastMessage} bind:icon={toastIcon} />