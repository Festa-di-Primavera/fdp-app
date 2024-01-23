<script lang="ts">
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
	let users = JSON.parse(data.usersList).users;

	let modalOpen: boolean = false;
	let dropdownOpenMap: { [key: string]: boolean } = {};
	users.forEach((user: any) => {
		dropdownOpenMap = {...dropdownOpenMap, [user.uid]: false}
	});
	
	const handleRoleChange = async (user: any, role: string) => {
		if (user.customClaims?.role !== role){
			await fetch(`/api/role/${user.uid}/${role}`, {method: 'PUT', headers: {'Content-Type': 'application/json'}})
			.then(() => {
				users = users.map((item: any) => {
					if (item.uid === user.uid) {
						item.customClaims? item.customClaims.role = role : item.customClaims = {role: role};
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

	const handleUserDelete = async (user: any) => {
		let res = await (await fetch(`/api/users/${user.uid}`, {method: 'DELETE', headers: {'Content-Type': 'application/json'}})).json();
		
		if(res.status === 200){
			users = users.filter((item: any) => item.uid !== user.uid);
		}
	};
	
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

	let currUserDelete: any | undefined = undefined;
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
	<Table hoverable={true} class="relative overflow-x-auto rounded-md shadow-md sm:rounded-lg mb-48">
		<TableHead>
			<TableHeadCell>Nome</TableHeadCell>
			<TableHeadCell>Email</TableHeadCell>
			<TableHeadCell>Ruolo</TableHeadCell>
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
{#if currUserDelete !== undefined}
	<Modal title={`Elimina ${currUserDelete?.displayName}`} bind:open={modalOpen} class="z-50">
		<span class="text-md">Vuoi eliminare l'utente <b>{currUserDelete?.displayName}</b>?</span>
		<div class="flex flex-col gap-2">
			<span class="text-sm">UID: {currUserDelete?.uid}</span>
			<span class="text-sm">Nome: {currUserDelete?.displayName}</span>
			<span class="text-sm">E-mail: {currUserDelete?.email}</span>
			<span class="text-sm">Ruolo: {currUserDelete?.customClaims?.role}</span>
		</div>
		<svelte:fragment slot="footer">
			<Button class="dark:bg-red-500 bg-red-500" on:click={() => {handleUserDelete(currUserDelete); modalOpen = false}}>
				Elimina
			</Button>
			<Button color="alternative" on:click={() => (modalOpen = false)}>
				Annulla
			</Button>
		</svelte:fragment>
	</Modal>
{/if}
