<script lang="ts">
	import AuthPanel from '../components/AuthPanel.svelte';
	import { getAuth, signInWithCustomToken } from 'firebase/auth';
	import { handleSignOut, user } from '../store/store';
	import { Button, Toast } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { getClientApp } from '$lib/firebase/client';
	import { XCircle } from 'lucide-svelte';

	export let data: { token: string };

	let toastMessage: string = '';
	let open: boolean = false;

	onMount(async() => {
		if(getAuth(getClientApp()).currentUser === null && data.token){
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
				open = true;
			});
		}
	});
</script>

<section class="flex flex-col w-full items-center justify-start px-5 py-10 text-xl text-black dark:text-white flex-grow">
	{#if $user === null || $user.emailVerified === false}
		<AuthPanel />
	{:else}
		<div class="flex flex-col items-center">
			<div class="flex flex-col items-center gap-4 text-center">
				<h1 class="text-3xl font-semibold text-primary-600">Home</h1>
				<p class="text-center text-2xl">Ciao <b>{$user?.displayName}</b>!</p>
				<p class="text-center">Questa è solo la home page!</p>
				<p class="flex items-end">
					Per iniziare ad usare l'applicazione usa il menu in alto a destra
				</p>
				<div class="mt-5 flex flex-col items-center gap-4 text-center">
					Se invece vuoi uscire dall'applicazione, clicca qui sotto
					<Button on:click={handleSignOut}>Esci dall'app</Button>
				</div>
			</div>
		</div>
	{/if}
</section>

<Toast on:close={() => open = false} bind:open color="red" class="w-max mt-10 mb-5 mx-auto right-0 left-0 fixed bottom-5" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<XCircle class="w-6 h-6  text-red-400" slot="icon"/>
	<span class='text-red-400 font-semibold'>{toastMessage}</span>
</Toast>