<script lang="ts">
	import {
		signInWithRedirect,
		GoogleAuthProvider,
		type User,
		onAuthStateChanged
	} from 'firebase/auth';
	import { clientAuth } from '$lib/firebase/firebase';
	import { Card } from 'flowbite-svelte';

	let currentUser: User | null = null;
	const provider = new GoogleAuthProvider();

	const handleSignIn = async () => {
		signInWithRedirect(clientAuth, provider)
			.then((result: any) => {
				const credential = GoogleAuthProvider.credentialFromResult(result);

				const token = credential!.accessToken;
				currentUser = result.user;
			})
			.catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;

				const email = error.customData.email;

				const credential = GoogleAuthProvider.credentialFromError(error);
			});
	};

	onAuthStateChanged(clientAuth, (user) => {
		currentUser = user;
	});
</script>

<Card class="flex flex-col items-center justify-center gap-4">
	<h1 class="text-3xl font-semibold text-primary-600">Log In</h1>
	<p class="text-center">Benvenuto! Per accedere alle funzionalità è necessario il login</p>

	<button class="p-3 w-max flex gap-4 border-2 items-center font-semibold rounded-md" on:click={handleSignIn}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlns:xlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 48 48"
            class="w-8 h-8"
			><defs
				><path
					id="a"
					d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
				/></defs
			><clipPath id="b"><use xlink:href="#a" overflow="visible" /></clipPath><path
				clip-path="url(#b)"
				fill="#FBBC05"
				d="M0 37V11l17 13z"
			/><path clip-path="url(#b)" fill="#EA4335" d="M0 11l17 13 7-6.1L48 14V0H0z" /><path
				clip-path="url(#b)"
				fill="#34A853"
				d="M0 37l30-23 7.9 1L48 0v48H0z"
			/><path clip-path="url(#b)" fill="#4285F4" d="M48 48L17 24l-4-3 35-10z" /></svg
		>
		Accedi con Google
	</button>
</Card>