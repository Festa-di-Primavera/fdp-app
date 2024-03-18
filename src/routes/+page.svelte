<script lang="ts">
	import AuthPanel from '../components/AuthPanel.svelte';
	import { getAuth, signInWithCustomToken } from 'firebase/auth';
	import { user } from '../store/store';
	import { Button, Toast } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { getClientApp, handleSignOut } from '$lib/firebase/client';
	import { XCircle, AlertCircle, LogOut } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import FeedbackToast from '../components/feedbacks/FeedbackToast.svelte';

	export let data: {logout?: boolean, token?: string };

	let feedbackToastMessage: string = '';
	let feedbackToastOpen: boolean = false;
	let error: boolean = false;
	let color: 'red' | 'yellow';

	$: color = error ? 'red' : 'yellow';
	$: toastIcon = error ? AlertCircle : XCircle;

	onMount(async() => {
		if(data.logout){
			handleSignOut(true);
			return;
		}

		if(window.location.search.split('?')[1] == 'roleUpdate'){
			feedbackToastMessage = 'Ruolo aggiornato! Rifai il login';
			feedbackToastOpen = true;
			error=false;
			goto(window.location.pathname);
			const timeOut = setTimeout(() => {
				feedbackToastOpen = false;

				clearTimeout(timeOut);
			}, 4000);
		}
		else if(window.location.search.split('?')[1] == 'checkOutExpired'){
			feedbackToastMessage = 'Non è più possibile fare check-out';
			error=false;
			feedbackToastOpen = true;
			goto(window.location.pathname);
			const timeOut = setTimeout(() => {
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 4000);
		} 

		if(getAuth(getClientApp()).currentUser === null && data.token){
			signInWithCustomToken(getAuth(), data.token).then((userCredential) => {
				$user = userCredential.user;
			}).catch((error) => {
				if(error.code === 'auth/invalid-custom-token'){
					feedbackToastMessage = 'Token non valido';
				}
				else if(error.code === 'auth/network-request-failed'){
					feedbackToastMessage = 'Errore di rete';
				}
				else{
					feedbackToastMessage = 'Errore sconosciuto';
				}
				error=true;
				feedbackToastOpen = true;
				const timeOut = setTimeout(() => {
					feedbackToastOpen = false;
					clearTimeout(timeOut);
				}, 8000);
			});
		}
	});
</script>

<svelte:head>
    <title>Festa di Primavera</title>
</svelte:head>

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
				<div class="mt-5 flex flex-col items-center gap-8 text-center">
					Se invece vuoi uscire dall'applicazione, clicca qui sotto
					<Button on:click={() => handleSignOut()} color="red" class="flex gap-2 items-center justify-center">
						Esci dall'app
						<LogOut class="w-4 h-4"/>
					</Button>
				</div>
			</div>
		</div>
	{/if}
</section>

<FeedbackToast
	bind:open={feedbackToastOpen}
	bind:color={color}
	bind:message={feedbackToastMessage}
	bind:icon={toastIcon}
/>
