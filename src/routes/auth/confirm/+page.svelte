<script lang="ts">
	import { onMount } from 'svelte'
	import { Button } from 'flowbite-svelte';
	
	import {goto} from '$app/navigation'
	// import {setUser} from '$lib/stores/user'
	import {isMagicLink, signInWithMagicLink} from '$lib/firebase/client'
	import {clearMagicEmail, getMagicEmail} from '$lib/localStorage/magicEmail'
    
	import { user } from "../../../store/store";

	let email: string | null

	type State = 'validating' | 'idle' | 'submitting' | Error
	let state: State = 'validating'

	const handleSubmit = async () => {
		// TODO: validate email
		login(email as string);
	}

	const login = async (magicEmail: string) => {
		email = magicEmail
		state = 'submitting'

		try {
			// qui dovrebbe essere validata la mail (emailVerified = true)
			const credential = await signInWithMagicLink(email, window.location.href)
			const token = await credential.user.getIdToken()
			
			// una volta effettuato il login sembra che un utente non possa più accedere con le sue credenziali... sistemare i cookies

			// DEBUG
			console.log(credential);
			console.log("auth/confirm" + token);
			console.log(state);

			const user = await fetch('/api/session', {
				method: 'POST',
				headers: {
					authorization: `Bearer ${token}`,
				},
			}).then((res) => res.json())

			// setUser(user)
            $user = user;


			clearMagicEmail()

			goto('/')
		} catch (error) {
			state = new Error("Something gone wrong...")// error
		}
	}

	onMount(async () => {
		if (!isMagicLink(window.location.href)) {
			state = new Error('Invalid magic link: How did you get here?!')
			return
		}

		const magicEmail = getMagicEmail()

		if (!magicEmail) {
			state = 'idle'
			return
		}

		await login(magicEmail).catch(() => {
			state = new Error(
				'We had a problem signing you in... Please try again? 😬'
			)
		})
	})
</script>

<svelte:head>
	<title>Confirm Login | Festa di Primavera</title>
</svelte:head>

<section class="container flex-grow px-2 text-2xl md:px-0">
	{#if state instanceof Error}
		<p>{state.message}</p>
	{:else if state === 'validating'}
		<p>🪄 Validating magic link 🪄</p>
	{:else if state === 'submitting'}
		<p>🪄 We are signing you in as {email} 🪄</p>
	{:else}
		<h1 class="mb-6 text-4xl">Confirm your email to login</h1>
		<div class="grid grid-cols-12 gap-4">
			<div class="col-span-12 lg:col-span-5">
				<p class="mb-2">
					We know you just clicked a magic link, but maybe you’re logging in
					from a different device to where you requested the login?
				</p>
				<p class="mb-4">
					In any case, please fill in your email address and submit this form!
				</p>
			</div>
			<form
				class="col-span-12 mt-1 flex flex-col gap-6 lg:col-span-7"
				on:submit={handleSubmit}
			>
				<!-- on:submit|preventDefault={handleSubmit} -->
				<input
					class="w-full rounded p-4 shadow"
					name="email"
					type="email"
					aria-label="email"
					placeholder="example@with-svelte.com"
					required
				/>
				<Button>finish login!</Button>
			</form>
		</div>
	{/if}
</section>
