<script lang="ts">
	import { UserRecord, type ListUsersResult } from 'firebase-admin/auth';
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
	import { Search, Filter, Trash2, ChevronsUpDown  } from 'lucide-svelte';
	
	export let data;
	let users: UserRecord[] = (JSON.parse(data.usersList) as ListUsersResult).users;
	console.log(users[0]);

	let modalOpen: boolean = false;
	let dropdownOpenMap: { [key: string]: boolean } = {};
	users.forEach((user: UserRecord) => {
		dropdownOpenMap = {...dropdownOpenMap, [user.uid]: false}
	});
	
	const handleRoleChange = async (user: UserRecord, role: string) => {
		if (user.customClaims?.role !== role){
			console.log(user.uid, role);
			await fetch(`/api/role/${user.uid}/${role}`, {method: 'PUT', headers: {'Content-Type': 'application/json'}})
			.then(() => {
				users = users.map((item: any) => {
					if (item.uid === user.uid) {
						item.customClaims.role = role;
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
	
	let searchTerm = '';
	let filter = 'name';

	$: filteredItems = users?.filter((item: UserRecord) => {
		if (filter === 'name')
			return item.displayName?.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
		else if (filter === 'email')
			return item.email?.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
		else if (filter === 'role')
			return item.customClaims?.role.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
		else return true;
	}) as UserRecord[];

	let currUserDelete: UserRecord | undefined = undefined;
</script>

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
	<Table hoverable={true} class="relative overflow-x-auto rounded-md shadow-md sm:rounded-lg pb-32">
		<TableHead>
			<TableHeadCell>Nome</TableHeadCell>
			<TableHeadCell>Email</TableHeadCell>
			<TableHeadCell>Role</TableHeadCell>
			<TableHeadCell class="text-center">Delete</TableHeadCell>
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
							{item.customClaims?.role.toUpperCase()}
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
					<TableBodyCell class="flex items-center justify-center">
						<Button class="px-2 py-1 dark:bg-red-500 bg-red-500" on:click={()=> {currUserDelete=item; modalOpen = true; }}>
							<Trash2 class="aspect-square w-4 dark:text-white text-gray-900" />
						</Button>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
</div>

<Modal bind:open={modalOpen} class="z-50">
	<!-- <p class="text-md font-semibold">Sei sicuro di voler eliminare l'utente {currUserDelete?.displayName}?</p> -->
	<!-- <p class="text-sm">UID: {currUserDelete?.uid}</p>
	<p class="text-sm">Nome: {currUserDelete?.displayName}</p>
	<p class="text-sm">E-mail: {currUserDelete?.email}</p>
	<p class="text-sm">Ruolo: {currUserDelete?.customClaims?.role}</p> -->
	<div class="flex flex-col items-center justify-center">
		<div class="flex gap-4 mt-5">
			<Button class="px-2 py-1 dark:bg-red-500 bg-red-500" on:click={() => (modalOpen = false)}>
				Annulla
			</Button>
			<Button class="px-2 py-1 dark:bg-red-500 bg-red-500" on:click={() => (modalOpen = false)}>
				Elimina
			</Button>
		</div>
	</div>
</Modal>
