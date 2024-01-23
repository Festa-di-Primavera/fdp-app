<script lang="ts">
	import { TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch } from 'flowbite-svelte';
	import { usersList } from '../../store/store';

	 let searchTerm = '';
	/*let items = $usersList?.users;
    console.log($usersList)
	//$: filteredItems = items?.filter((item) => item.uid.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1); */
	export let data;
	let users = JSON.parse(data.usersList).users;
    console.log(users);
    const filteredItems = null;
</script>

<TableSearch placeholder="Search by maker name" hoverable={true} bind:inputValue={searchTerm}>
	<TableHead>
		<TableHeadCell>Nome</TableHeadCell>
		<TableHeadCell>Email</TableHeadCell>
		<TableHeadCell>Role</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#if users}
			{#each users as item}
			<TableBodyRow>
				<TableBodyCell>{item.displayName}</TableBodyCell>
				<TableBodyCell>{item.email}</TableBodyCell>
				<TableBodyCell>{item.customClaims?.role}</TableBodyCell>
			</TableBodyRow>
			{/each}
		{/if}
	</TableBody>
</TableSearch>