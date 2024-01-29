<script lang="ts">
	import {
		type User,
		onAuthStateChanged,
		createUserWithEmailAndPassword,
		signInWithEmailAndPassword,
		getAuth,
		sendEmailVerification
	} from 'firebase/auth';
	import { Eye, EyeOff, XCircle } from 'lucide-svelte';
	import { Button, Input, Label, Card, Helper, Toast } from 'flowbite-svelte';

	import { getClientApp } from '$lib/firebase/client';

	let currentUser: User | null = null;

	let option: 'login' | 'register' = 'login';

	let email: string = '';
	let password: string = '';
	let repeatPassword: string = '';
	let pwVisible: boolean = false;
	let rpPwVisible: boolean = false;
	let validatorError: boolean = true;

	$: {
		if (validatorError) {
			validatorError = !(password === repeatPassword);
		}
	}

	const handleSubmission = async () => {
		if (option === 'login') {
			try {
				await signInWithEmailAndPassword(getAuth(getClientApp()), email, password);
			} catch (error) {
				console.error(error);
			}
		} else {
			try {
				const userCredential = await createUserWithEmailAndPassword(
					getAuth(getClientApp()),
					email,
					password
				);
				const user = userCredential.user;

				await sendEmailVerification(user);

				console.log('email verification sent'); // TODO: add toast
			} catch (error) {
				// un esempio di errore è: "password must be at least 6 characters"
				console.error(error); // TODO: add toast
			}
		}
	};

	onAuthStateChanged(getAuth(getClientApp()), (user) => {
		currentUser = user;
	});
</script>

{#if currentUser === null}
	<Card class="flex w-full max-w-96 flex-col items-center justify-center">
		<div class="mb-5 flex w-full justify-around">
			<button
				on:click={() => (option = 'login')}
				class="w-[40%] border-b-2 {option == 'register'
					? 'border-transparent'
					: 'border-primary-500 text-black dark:text-white'} pb-3">Login</button
			>
			<button
				on:click={() => (option = 'register')}
				class="w-[40%] border-b-2 {option == 'login'
					? 'border-transparent'
					: 'border-primary-500 text-black dark:text-white'} pb-3">Registrati</button
			>
		</div>

		<div class="flex w-full flex-col gap-3">
			<h1 class="w-max text-3xl font-semibold text-primary-600">
				{option === 'login' ? 'Accedi' : 'Registrati'}
			</h1>

			<Label>
				Email address
				<Input
					type="email"
					placeholder="john.doe@company.com"
					bind:value={email}
					required
					class="mt-2"
				/>
			</Label>

			<Label>
				Password
				<Input
					id="password"
					name="password"
					type={pwVisible ? 'text' : 'password'}
					bind:value={password}
					class="mt-2"
				>
					<button
						type="button"
						slot="right"
						class="flex items-center justify-center"
						tabindex="-1"
						on:click={() => (pwVisible = !pwVisible)}
					>
						{#if pwVisible}
							<EyeOff />
						{:else}
							<Eye />
						{/if}
					</button>
				</Input>
				<!-- TODO: add check of security of password -->
			</Label>

			{#if option === 'register'}
				<Label>
					Conferma password
					<Input
						id="repeat-pw"
						name="password"
						type={rpPwVisible ? 'text' : 'password'}
						color={!validatorError ? 'base' : 'red'}
						bind:value={repeatPassword}
						on:blur={() => (validatorError = !(password === repeatPassword))}
						class="mt-2"
					>
						<button
							type="button"
							slot="right"
							class="flex items-center justify-center"
							tabindex="-1"
							on:click={() => (rpPwVisible = !rpPwVisible)}
						>
							{#if rpPwVisible}
								<EyeOff />
							{:else}
								<Eye />
							{/if}
						</button>
					</Input>
					{#if validatorError}
						<Helper class="mt-2" color="red">Le password non coincidono</Helper>
					{/if}
				</Label>
			{/if}

			<Button class="mt-5 w-full" on:click={handleSubmission} bind:disabled={validatorError}
				>{option === 'login' ? 'Accedi' : 'Registrati'}</Button
			>
		</div>
	</Card>
{:else if currentUser.emailVerified === false}
	<div>
		<p>Ti è stata mandata una mail di verifica all'indirizzo {currentUser.email}</p>
	</div>
{/if}
