<script lang="ts">
	import AuthPanel from '../components/AuthPanel.svelte';
	import { getAuth, signInWithCustomToken } from 'firebase/auth';
	import { handleSignOut, user } from '../store/store';
	import { Button } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { getClientApp } from '$lib/firebase/client';

	export let data: { token: string };

	onMount(async() => {
		if(getAuth(getClientApp()).currentUser === null && data.token){
			signInWithCustomToken(getAuth(), data.token).then((userCredential) => {
				$user = userCredential.user;
			}).catch((error) => {
				// TODO: ERROR HANDLING
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
				<p class="text-center text-2xl">Ciao <b>{$user?.email}</b>!</p>
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
