<script lang="ts">
	import { onMount } from 'svelte';
	import { Input, Button, Modal, Spinner, Toast, NumberInput, Toggle, Label } from 'flowbite-svelte';
	import { getAuth, signInWithCustomToken } from 'firebase/auth';
	import { CheckCircle2, Ticket, XCircle } from 'lucide-svelte'
	
	import { getClientApp, handleSignOut } from '$lib/firebase/client.js';

	import { user } from '../../store/store.js';
	import UsersTable from '../../components/UsersTable.svelte';
	import SignInToast from '../../components/feedbacks/SignInToast.svelte';
	import FeedbackToast from '../../components/feedbacks/FeedbackToast.svelte';
	
	export let data: { logout?: boolean, token?: string, usersList?: string};

	onMount(async() => {
		if(data.logout){
			handleSignOut(true);
			return;
		}

		if(getAuth(getClientApp()).currentUser === null && data.token){
			signInWithCustomToken(getAuth(), data.token).then((userCredential) => {
				$user = userCredential.user;
			}).catch((error) => {
				if(error.code === 'auth/invalid-custom-token'){
					signInToastMessage = 'Token non valido';
				}
				else if(error.code === 'auth/network-request-failed'){
					signInToastMessage = 'Errore di rete';
				}
				else{
					signInToastMessage = 'Errore sconosciuto';
				}
				signInToastOpen = true;
				clearTimeout(timeOut);
				timeOut = setTimeout(() => {
					signInToastOpen = false;
					clearTimeout(timeOut);
				}, 3500);
			});
		}
	});

	// fetch all users
	let users = JSON.parse(data.usersList || 'null')?.users;

	// modal state variable
	let deleteModalOpen: boolean = false;
	
	// login error toast variables
	let signInToastOpen: boolean = false;
	let signInToastMessage: string = '';

	// changes toast variables
	let changeToastOpen: boolean = false;
	let color: 'green' | 'red' = 'green';
	let message: string = '';
	let error: boolean = false;
	let timeOut: NodeJS.Timeout;

	// function to handle user delete
	const handleUserDelete = async (user: any) => {
		try{
			let res = await fetch(`/api/users/${user.uid}`, {method: 'DELETE', headers: {'Content-Type': 'application/json'}});

			if(res.ok){
				error = false;
				color = 'green';
				users = users.filter((item: any) => item.uid !== user.uid);
			}
			else if(res.status === 404){
				error = true;
				color = 'red';
				users = users.filter((item: any) => item.uid !== user.uid);
			}
			else{
				error = true;
				color = 'red';
			}
			
			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);

			message = (await res.json()).message;
		}
		catch(e) {
			error = true;
			color = 'red';
			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			message = 'Errore di rete';
		}
	};

	let debtModalOpen: boolean = false;
	let debtPay: number = 0;
	let payMax: boolean = false;

	const claimMoney = async (user: any) => {
		if(debtPay <= 0 || isNaN(debtPay) || debtPay > currSelectedUser?.customClaims?.money){
			error = true;
			color = 'red';
			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			message = 'Importo non valido';
			return;
		}

		try {
			const resp = await fetch(`/api/money/${user.uid}`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({money: debtPay})
			});

			if(resp.ok){
				users = users.map((item: any) => {
					if (item.uid === user.uid) {
						item.customClaims.money -= debtPay;
					}
					return item;
				});
				error = false;
				color = 'green';
			}
			else{
				error = true;
				color = 'red';
			}

			message = (await resp.json()).message;
			changeToastOpen = true;

			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
		} 
		catch(e) {
			error = true;
			color = 'red';
			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			message = 'Errore di rete';
		}
		debtModalOpen = false;
	}
	
	// alias modal state variables
	let aliasModalOpen: boolean = false;
	let alias: string = '';
	
	// current selected user state variable
	let currSelectedUser: any | undefined = undefined;

	const handleAliasChange = async (user: any) => {
		if(alias !== null && alias != '' && alias != user.customClaims?.alias){
			const res = await fetch(`/api/alias/${user.uid}/${alias}`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json'}
			});

			if(res.ok){
				color = 'green';
				error = false;
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
			else {
				color = 'red';
				error = true;
			}
			
			if(res.status === 404){
				users = users.filter((item: any) => item.uid !== user.uid);
			}

			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			message = (await res.json()).message;
		}

		aliasModalOpen = false;
		alias = '';
	};

	let blocksModalOpen: boolean = false;
	let currentBlocks: string[] = [];
	let ticketCode: string = '';

	function getFirstCodeOfBlock(inputCode: string): string {
		const blockNumber = Math.floor((parseInt(inputCode.slice(5)) - 1) / 50) * 50 + 1;

		const firstCodeOfBlock = `XNRF ${blockNumber.toString().padStart(5, '0')}`;
		return firstCodeOfBlock;
	}

	const addBlock = async (ticketCode: string, uid: string) => {
		if(ticketCode === ''){
			error = true;
			color = 'red';
			message = 'Codice blocco non valido';
			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			return;
		}
		
		try {
			ticketCode = getFirstCodeOfBlock(ticketCode);

			const resp = await fetch(`/api/tickets/blocks/${uid}/${encodeURIComponent(ticketCode)}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + data.token
				}
			});

			if(resp.ok){
				error = false;
				color = 'green';
			}
			else{
				error = true;
				color = 'red';
			}

			message = (await resp.json()).message;
			changeToastOpen = true;

			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
		}
		catch(e) {
			error = true;
			color = 'red';
			changeToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				changeToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			message = 'Errore di rete';
		}
	}

	$: toastIcon = error ? XCircle : CheckCircle2;
</script>

<svelte:head>
    <title>Utenti</title>
</svelte:head>

{#if $user}
	<UsersTable bind:users bind:currSelectedUser bind:aliasModalOpen bind:deleteModalOpen bind:debtModalOpen bind:blocksModalOpen bind:currentBlocks bind:loginToken={data.token}/>
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
		<Modal bind:open={debtModalOpen} title={`Salda il debito di ${currSelectedUser?.displayName}`} class="z-50">
			<span class="text-md">Vuoi saldare il debito di <b>{currSelectedUser?.displayName}</b>?</span>
			<div class="flex flex-col gap-2">
				<span class="text-sm">UID: {currSelectedUser?.uid}</span>
				<span class="text-sm">Nome: {currSelectedUser?.displayName}</span>
				<span class="text-sm">E-mail: {currSelectedUser?.email}</span>
				<span class="text-sm">Ruolo: {currSelectedUser?.customClaims?.role}</span>
				<span class="text-sm">Alias: {currSelectedUser?.customClaims?.alias}</span>
			</div>
			<div class="flex justify-left gap-2 mt-4 items-center">
				<NumberInput min="1" max={currSelectedUser?.customClaims?.money} bind:value={debtPay} class="w-24 text-center" bind:disabled={payMax} />
				<span class="text-nowrap">su {currSelectedUser?.customClaims?.money}€</span>
				
			</div>
			<Toggle bind:checked={payMax} on:click={()=>{if(!payMax) debtPay = currSelectedUser?.customClaims?.money}} class="w-max">Salda tutto</Toggle>
			<svelte:fragment slot="footer">
				<Button on:click={() => claimMoney(currSelectedUser)}>
					Salda
				</Button>
				<Button color="alternative" on:click={() => {debtModalOpen = false; debtPay=0}}>
					Annulla
				</Button>
			</svelte:fragment>
		</Modal>
		<Modal bind:open={blocksModalOpen} title={`Blocchetti assegnati a ${currSelectedUser?.displayName}`} class="z-50" outsideclose autoclose on:close={()=> ticketCode=''}>
			<span class="text-md">
				{#if currentBlocks.length > 0}
					Blocchetti di
				{/if}
				<b>{currSelectedUser?.displayName}</b>
				{#if currentBlocks.length == 0}
					non ha blocchetti assegnati
				{/if}
			</span>
			{#if currentBlocks.length > 0}
				<div class="flex flex-col gap-2">
					{#each currentBlocks as block}
						<span class="text-sm"> - {block}</span>
					{/each}
				</div>
			{/if}
			<div>
				<Label class="text-black dark:text-white font-medium text-md w-full">
					<div class="flex flex-col mb-2">
						Codice Blocco
						<span class="font-normal text-gray-500 text-xs">(biglietto qualsiasi del blocchetto)</span>
					</div>
					<div class="w-full flex gap-6 items-center justify-center">
						<Input bind:value={ticketCode} autocomplete="off" placeholder="XNRF 45151">
							<Ticket slot="left" class="w-6 h-6 text-primary-600 dark:text-white"/>
						</Input>
						<Button on:click={() => {
							addBlock(ticketCode, currSelectedUser.uid);
						}}>
							Aggiungi
						</Button>
					</div>
				</Label>
			</div>
		</Modal>
	{/if}
{:else}
	<div class="w-full flex flex-col flex-grow gap-5 items-center justify-center mt-10">
		<Spinner size="sm" class="max-w-12 self-center"/>
		<span class="text-primary-600 font-semibold text-2xl">Attendere...</span>
	</div>
{/if}

<SignInToast bind:open={signInToastOpen} bind:message={signInToastMessage} />
<FeedbackToast bind:open={changeToastOpen} bind:color bind:icon={toastIcon} bind:message/>
