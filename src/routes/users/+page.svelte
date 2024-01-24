<script lang="ts">
	import { clientAuth } from '$lib/firebase/firebase.js';
	import { onAuthStateChanged } from 'firebase/auth';
	import { Input, Button, Modal } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { user } from '../../store/store.js';
	import { goto } from '$app/navigation';
	import UsersTable from '../../components/UsersTable.svelte';
	
	// fetch all users
	export let data;
	let users = JSON.parse(data.usersList).users;

	// modal state variable
	let deleteModalOpen: boolean = false;

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
	
	// current selected user state variable
	let currSelectedUser: any | undefined = undefined;

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
	<UsersTable bind:users bind:currSelectedUser bind:aliasModalOpen bind:deleteModalOpen/>
	{#if currSelectedUser !== undefined}
		<Modal title={`Elimina ${currSelectedUser?.displayName}`} bind:open={deleteModalOpen} class="z-50">
			<span class="text-md">Vuoi eliminare l'utente <b>{currSelectedUser?.displayName}</b>?</span>
			<div class="flex flex-col gap-2">
				<span class="text-sm">UID: {currSelectedUser?.uid}</span>
				<span class="text-sm">Nome: {currSelectedUser?.displayName}</span>
				<span class="text-sm">E-mail: {currSelectedUser?.email}</span>
				<span class="text-sm">Ruolo: {currSelectedUser?.customClaims?.role}</span>
				<span class="text-sm">Alias: {currSelectedUser?.customClaims?.alias}</span>
			</div>
			<svelte:fragment slot="footer">
				<Button class="dark:bg-red-500 bg-red-500" on:click={() => {handleUserDelete(currSelectedUser); deleteModalOpen = false}}>
					Elimina
				</Button>
				<Button color="alternative" on:click={() => (deleteModalOpen = false)}>
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
				<Button on:click={() => handleAliasChange(currSelectedUser)}>
					Aggiorna
				</Button>
				<Button color="alternative" on:click={() => {alias=''; aliasModalOpen = false}}>
					Annulla
				</Button>
			</svelte:fragment>
		</Modal>
	{/if}
{/if}