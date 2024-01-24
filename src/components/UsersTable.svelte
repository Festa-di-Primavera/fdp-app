<script lang="ts">
	import { Button, Dropdown, DropdownItem, Input, Popover, Radio, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from "flowbite-svelte";
	import { ChevronsUpDown, Filter, PenBox, Search, Trash2 } from "lucide-svelte";
	
	export let users: any;
	export let currSelectedUser: any | undefined;
	export let aliasModalOpen: boolean;
	export let deleteModalOpen: boolean;
	
	// dropdown state variables
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

	const triggerAliasModal = async (user: any) => {
		currSelectedUser = user;
		aliasModalOpen = true;
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
						<Button class="px-2 py-1 dark:bg-red-500 bg-red-500" on:click={()=> {currSelectedUser=item; deleteModalOpen = true; }}>
							<Trash2 class="aspect-square w-4 dark:text-white text-gray-900" />
						</Button>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
</div>