<script lang="ts">
	import { TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Table, Input, Popover, Radio } from 'flowbite-svelte';
	import { Search, Filter } from 'lucide-svelte';

	let searchTerm = '';
	export let data;
	let users = JSON.parse(data.usersList).users;

	$: filteredItems = users?.filter(
		(item: any) => {
			if(filter === 'name')
				return item.displayName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
			else if(filter === 'email')
				return item.email.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
			else if(filter === 'role')
				return item.customClaims?.role.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
			else
				return true; 
		}
	);

	let filter = 'name';
</script>

<div class="mx-5 mt-5">
	<Input placeholder="Cerca per nome" bind:value={searchTerm}>
		<Search slot="left"/>
		<button slot="right">
			<Filter/>
			<Popover placement="bottom-end" class="z-50 p-0" defaultClass='pt-2'>
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
	<Table hoverable={true} class="relative overflow-x-auto shadow-md sm:rounded-lg rounded-md">
		<TableHead>
			<TableHeadCell>Nome</TableHeadCell>
			<TableHeadCell>Email</TableHeadCell>
			<TableHeadCell>Role</TableHeadCell>
		</TableHead>
		<TableBody tableBodyClass="divide-y">
			{#each filteredItems as item}
				<TableBodyRow>
					<TableBodyCell tdClass='px-6 py-4 whitespace-nowrap font-medium flex gap-2'>
						<img src={item.photoURL} alt="Profile" class="w-5 h-5 rounded-full"/>
						{item.displayName}</TableBodyCell>
					<TableBodyCell>{item.email}</TableBodyCell>
					<TableBodyCell>{item.customClaims?.role}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
</div>