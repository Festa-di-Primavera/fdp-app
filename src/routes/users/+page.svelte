<script lang="ts">
	import { clientAuth } from '$lib/firebase/firebase.js';
	import { onAuthStateChanged } from 'firebase/auth';
	import {
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Table,
		Input,
		Popover,
		Radio,
		Button,
		Dropdown,
		DropdownItem,
		Modal
	} from 'flowbite-svelte';
	import { Search, Filter, Trash2, ChevronsUpDown, Check, PenBox } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { user } from '../../store/store.js';
	import { goto } from '$app/navigation';
	
	// fetch all users
	export let data;
	let users = JSON.parse(data.usersList).users;

	// modal and dropdown state variables
	let modalOpen: boolean = false;
	let dropdownOpenMap: { [key: string]: boolean } = {};
	users.forEach((user: any) => {
		dropdownOpenMap = {...dropdownOpenMap, [user.uid]: false}
	});
	
	// function to handle role change
	// TODO: toast con errori/successo
	const handleRoleChange = async (user: any, role: string) => {
		if (user.customClaims?.role !== role){
			await fetch(`/api/role/${user.uid}/${role}`, {method: 'PUT', headers: {'Content-Type': 'application/json'}})
			.then(() => {
				users = users.map((item: any) => {
					if (item.uid === user.uid) {
						if(item.customClaims)
							item.customClaims.role = role
						else
							item.customClaims = {...item.customClaims, role: role};
					}
					return item;
				});
			})
			.catch((error) => {
				console.log(error);
			});
		}

		dropdownOpenMap = { ...dropdownOpenMap, [user.uid]: false };
	};

	// function to handle user delete
	// TODO: toast con errori/successo
	const handleUserDelete = async (user: any) => {
		let res = await (await fetch(`/api/users/${user.uid}`, {method: 'DELETE', headers: {'Content-Type': 'application/json'}})).json();
		
		if(res.status === 200){
			users = users.filter((item: any) => item.uid !== user.uid);
		}
	};

	let aliasModalOpen: boolean = false;
	let alias: string = '';
	const triggerAliasModal = async (user: any) => {
		currSelectedUser = user;
		aliasModalOpen = true;
	};

	// TODO: toast con errori/successo
	const handleAliasChange = async (user: any) => {
		if(alias !== null && alias != '' && alias != user.customClaims?.alias){
			const res = await (await fetch(`/api/alias/${user.uid}/${alias}`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json'}
			})).json();

			if(res.status === 200){
				users = users.map((item: any) => {
					if (item.uid === user.uid) {
						if(item.customClaims.alias)
							item.customClaims.alias = alias
						else
							item.customClaims = {...item.customClaims, alias: alias};
					}
					return item;
				});
			}
			else if(res.status === 400){
				console.log(res.body);
			}
			else{
				console.log(res.body);
			}
		}

		aliasModalOpen = false;
		alias = '';
	};
	
	// search and filter variables
	let searchTerm = '';
	let filter = 'name';

	$: filteredItems = users?.filter((item: any) => {
		if (filter === 'name')
			return item.displayName?.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
		else if (filter === 'email')
			return item.email?.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
		else if (filter === 'role')
			return item.customClaims?.role.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
		else return true;
	});

	// current selected user state variable
	let currSelectedUser: any | undefined = undefined;

	onMount(async() => {
		onAuthStateChanged(clientAuth, (newUser) => {
			$user = newUser;
			if($user === null){
				goto("/");
				return;
			}
		});
	});
</script>

{#if $user}
	<div class="mx-5 mt-5">
		<Input placeholder="Cerca per nome" bind:value={searchTerm}>
			<Search slot="left" />
			<button slot="right">
				<Filter />
				<Popover placement="bottom-end" class="z-50 p-0" defaultClass="pt-2">
					Filtra per
					<ul class="w-48 divide-y divide-gray-200 dark:divide-gray-600">
						<li><Radio class="p-3" bind:group={filter} value="name">Nome</Radio></li>
						<li><Radio class="p-3" bind:group={filter} value="email">E-Mail</Radio></li>
						<li><Radio class="p-3" bind:group={filter} value="role">Ruolo</Radio></li>
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
						<TableBodyCell tdClass="px-6 py-4 whitespace-nowrap font-medium flex gap-2">
							<img src={item.photoURL} alt="Profile" class="h-5 w-5 rounded-full" />
							<span class="mr-4">{item.displayName}</span>
						</TableBodyCell>
						<TableBodyCell>{item.email}</TableBodyCell>
						<TableBodyCell>
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
							<Button class="px-2 py-1 dark:bg-red-500 bg-red-500" on:click={()=> {currSelectedUser=item; modalOpen = true; }}>
								<Trash2 class="aspect-square w-4 dark:text-white text-gray-900" />
							</Button>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</div>
	{#if currSelectedUser !== undefined}
		<Modal title={`Elimina ${currSelectedUser?.displayName}`} bind:open={modalOpen} class="z-50">
			<span class="text-md">Vuoi eliminare l'utente <b>{currSelectedUser?.displayName}</b>?</span>
			<div class="flex flex-col gap-2">
				<span class="text-sm">UID: {currSelectedUser?.uid}</span>
				<span class="text-sm">Nome: {currSelectedUser?.displayName}</span>
				<span class="text-sm">E-mail: {currSelectedUser?.email}</span>
				<span class="text-sm">Ruolo: {currSelectedUser?.customClaims?.role}</span>
				<span class="text-sm">Alias: {currSelectedUser?.customClaims?.alias}</span>
			</div>
			<svelte:fragment slot="footer">
				<Button class="dark:bg-red-500 bg-red-500" on:click={() => {handleUserDelete(currSelectedUser); modalOpen = false}}>
					Elimina
				</Button>
				<Button color="alternative" on:click={() => (modalOpen = false)}>
					Annulla
				</Button>
			</svelte:fragment>
		</Modal>
		<Modal bind:open={aliasModalOpen} title={`Aggiorna l'alias di ${currSelectedUser?.displayName}`} class="z-50">
			<span class="text-md">Vuoi aggiornare l'alias di <b>{currSelectedUser?.displayName}</b>?</span>
			<div class="flex flex-col gap-2">
				<span class="text-sm">UID: {currSelectedUser?.uid}</span>
				<span class="text-sm">Nome: {currSelectedUser?.displayName}</span>
				<span class="text-sm">E-mail: {currSelectedUser?.email}</span>
				<span class="text-sm">Ruolo: {currSelectedUser?.customClaims?.role}</span>
				<span class="text-sm">Alias: {currSelectedUser?.customClaims?.alias}</span>
			</div>
			<Input bind:value={alias} class="mt-4" />
			<svelte:fragment slot="footer">
				<Button color="red" on:click={() => handleAliasChange(currSelectedUser)}>
					Aggiorna
				</Button>
				<Button color="alternative" on:click={() => {alias=''; aliasModalOpen = false}}>
					Annulla
				</Button>
			</svelte:fragment>
		</Modal>
	{/if}
{/if}