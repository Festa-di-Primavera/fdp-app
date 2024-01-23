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
		DropdownItem
	} from 'flowbite-svelte';
	import { Search, Filter, Trash2 } from 'lucide-svelte';

	let searchTerm = '';
	export let data;
	let users = JSON.parse(data.usersList).users;

	const handleRoleChange = async (user: any, role: string) => {
		await fetch(`/api/role/${user.uid}/${role}`, {method: 'PUT', headers: {'Content-Type': 'application/json'}})
			.then(() => {
				console.log('Role updated successfully');
			})
			.catch((error) => {
				console.log(error);
			});
	};

	$: filteredItems = users?.filter((item: any) => {
		if (filter === 'name')
			return item.displayName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
		else if (filter === 'email')
			return item.email.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
		else if (filter === 'role')
			return item.customClaims?.role.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
		else return true;
	});

	let filter = 'name';
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
	<Table hoverable={true} class="relative overflow-x-auto rounded-md shadow-md sm:rounded-lg">
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
						{item.displayName}</TableBodyCell
					>
					<TableBodyCell>{item.email}</TableBodyCell>
					<TableBodyCell>
						<button>
							{item.customClaims?.role}
						</button>
						<Dropdown>
							<DropdownItem class={item.customClaims?.role === undefined ? `text-primary-600` : ''}>
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
						<Button class="px-2 py-1" href={"https://youtu.be/dQw4w9WgXcQ"}>
							<Trash2 class="aspect-square w-4" />
						</Button>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
</div>
