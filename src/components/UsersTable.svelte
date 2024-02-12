<script lang="ts">
	import { Button, Dropdown, DropdownItem, Input, Popover, Radio, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Toast } from "flowbite-svelte";
	import { CheckCircle2, ChevronsUpDown, Filter, PenBox, Search, Trash2, XCircle } from "lucide-svelte";
	import { roles } from "../models/role";
	import { user } from "../store/store";
	
	export let users: any;
	export let currSelectedUser: any | undefined;
	export let aliasModalOpen: boolean;
	export let deleteModalOpen: boolean;

	let color: 'green' | 'red' = 'green';
	let message: string = '';
	let error: boolean = false;
	let toastOpen: boolean = false;
	
	// dropdown state variables
	let dropdownOpenMap: { [key: string]: boolean } = {};
	users.forEach((user: any) => {
		dropdownOpenMap = {...dropdownOpenMap, [user.uid]: false}
	});

	let enumBindings: {[key: string]: roles} = {
		'normal': roles.NORMAL,
		'seller': roles.SELLER,
		'check-in': roles.CHECKIN,
		'admin': roles.ADMIN,
		'superadmin': roles.SUPERADMIN
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
				
				message = (await response.json()).message;
				toastOpen = true;

				const timeOut = setTimeout(() => {
					toastOpen = false;
					clearTimeout(timeOut);
				}, 3500);
			}
			catch(e) {
				error = true;
				color = 'red';
				toastOpen = true;

				const timeOut = setTimeout(() => {
					toastOpen = false;
					clearTimeout(timeOut);
				}, 3500);

				message = 'Errore di rete';
			}
		}
	};

	const triggerAliasModal = async (user: any) => {
		currSelectedUser = user;
		aliasModalOpen = true;
	};

	// search and filter variables
	let searchTerm = '';
	let filter = 'nome';
	let filteredItems: any[] = [];

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

		filteredItems.sort((a, b) => {
			if (a.displayName < b.displayName) {
				return -1;
			}
			if (a.displayName > b.displayName) {
				return 1;
			}
			return a.email < b.email ? -1 : 1;
		});
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
						<li><Radio class="p-3" bind:group={filter} value="ruolo">Ruolo</Radio></li>
						<li><Radio class="p-3" bind:group={filter} value="alias">Alias</Radio></li>
					</ul>
				</Popover>
			</button>
		</Input>
	</div>
	<div class="mx-5 mt-5">
		<Table hoverable={true} class="relative overflow-x-auto rounded-md shadow-md sm:rounded-lg mb-48">
			<TableHead>
				<TableHeadCell>Nome</TableHeadCell>
				<TableHeadCell>Email</TableHeadCell>
				<TableHeadCell>Ruolo</TableHeadCell>
				<TableHeadCell>Alias</TableHeadCell>
				<TableHeadCell class="text-center">Elimina</TableHeadCell>
			</TableHead>
			<TableBody tableBodyClass="divide-y">
				{#each filteredItems as item}
					<TableBodyRow>
						<TableBodyCell tdClass="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-4">
							<div style="background: {item.customClaims?.color || '#000'};" class="h-7 w-7 rounded-full flex items-center justify-center text-white" >
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
								<Dropdown placement="bottom" class="z-50" bind:open={dropdownOpenMap[item.uid]}>
									<DropdownItem class={(item.customClaims?.role === undefined || item.customClaims?.role === 'normal') ? `text-primary-600` : ''}>
										<button on:click={() => handleRoleChange(item, 'normal')}> NORMAL </button>
									</DropdownItem>
									<DropdownItem class={item.customClaims?.role === 'seller' ? `text-primary-600` : ''}>
										<button on:click={() => handleRoleChange(item, 'seller')}> SELLER </button>
									</DropdownItem>
									<DropdownItem
									class={item.customClaims?.role === 'check-in' ? `text-primary-600` : ''}
									>
									<button on:click={() => handleRoleChange(item, 'check-in')}> CHECK-IN </button>
									</DropdownItem>
									<DropdownItem class={item.customClaims?.role === 'admin' ? `text-primary-600` : ''}>
										<button on:click={() => handleRoleChange(item, 'admin')}> ADMIN </button>
									</DropdownItem>
									<DropdownItem
									class={item.customClaims?.role === 'superadmin' ? `text-primary-600` : ''}
									>
										<button on:click={() => handleRoleChange(item, 'superadmin')}> SUPERADMIN </button>
									</DropdownItem>
								</Dropdown>
							{/if}
						</TableBodyCell>
						<TableBodyCell>
								<div class="flex gap-3 w-full justify-between">
									{item.customClaims?.alias}
									<button on:click={() => triggerAliasModal(item)}>
										<PenBox />
									</button>
								</div>
						</TableBodyCell>
						<TableBodyCell class="flex items-center justify-center">
							<Button disabled={item.email === import.meta.env.VITE_ADMIN_EMAIL1 || item.email === import.meta.env.VITE_ADMIN_EMAIL2} class="px-2 py-1 dark:bg-red-500 bg-red-500" on:click={()=> {currSelectedUser=item; deleteModalOpen = true; }}>
								<Trash2 class="aspect-square w-4 dark:text-white text-gray-900" />
							</Button>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</div>
{/if}

<Toast on:close={() => toastOpen = false} bind:open={toastOpen} color={color} class="w-max mt-5 mx-auto right-0 left-0 fixed bottom-5" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<svelte:component this={error ? XCircle : CheckCircle2} class="w-6 h-6  text-{color}-400" slot="icon"/>
	<span class={`text-${color}-400 font-semibold`}>{message}</span>
</Toast>