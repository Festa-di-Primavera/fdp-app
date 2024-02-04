<script lang="ts">
	import { onMount } from 'svelte';
	import { Input, Button, Modal, Spinner, Toast } from 'flowbite-svelte';
	import { getAuth, signInWithCustomToken } from 'firebase/auth';
	import { XCircle } from 'lucide-svelte'
	
	import { getClientApp } from '$lib/firebase/client.js';

	import { user } from '../../store/store.js';
	import UsersTable from '../../components/UsersTable.svelte';
	
	export let data;
	// fetch all users
	let users = JSON.parse(data.usersList || '')?.users;

	// modal state variable
	let deleteModalOpen: boolean = false;
	let toastOpen: boolean = false;
	let toastMessage: string = '';

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
						if(item.customClaims?.alias)
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
		if(getAuth(getClientApp()).currentUser === null){
			signInWithCustomToken(getAuth(), data.token).then((userCredential) => {
				$user = userCredential.user;
			}).catch((error) => {
				if(error.code === 'auth/invalid-custom-token'){
					toastMessage = 'Token non valido';
				}
				else if(error.code === 'auth/network-request-failed'){
					toastMessage = 'Errore di rete';
				}
				else{
					toastMessage = 'Errore sconosciuto';
				}
				toastOpen = true;
			});
		}
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
{:else}
	<div class="w-full flex flex-col flex-grow gap-5 items-center justify-center mt-10">
		<Spinner size="sm" class="max-w-12 self-center"/>
		<span class="text-primary-600 font-semibold text-2xl">Attendere...</span>
	</div>
{/if}

<Toast bind:open={toastOpen} color="red" class="w-max mt-10 mb-5 mx-auto right-0 left-0" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<XCircle class="w-6 h-6  text-red-400" slot="icon"/>
	<span class='text-red-400 font-semibold'>{toastMessage}</span>
</Toast>