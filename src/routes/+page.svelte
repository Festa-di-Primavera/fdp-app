<script lang="ts">
	import AuthPanel from '../components/AuthPanel.svelte';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';
	import { handleSignOut, user } from '../store/store';
	import { Button } from 'flowbite-svelte';

	const auth = getAuth();

	onAuthStateChanged(auth, (newUser) => {
		$user = newUser;
	});
</script>

<section
	class="flex w-full items-center justify-center px-5 py-10 text-xl text-black dark:text-white"
>
	{#if $user === null || $user.emailVerified === false}
		<AuthPanel />
	{:else}
		<div class="flex flex-col items-center">
			<div class="flex flex-col items-center gap-4 text-center">
				<h1 class="text-3xl font-semibold text-primary-600">Home</h1>
				<p class="text-center text-2xl">Ciao <b>{auth.currentUser?.email}</b>!</p>
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
