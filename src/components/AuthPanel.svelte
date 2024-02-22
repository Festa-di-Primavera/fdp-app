<script lang="ts">
	import {
		type ActionCodeSettings,
		onAuthStateChanged,
		createUserWithEmailAndPassword,
		signInWithEmailAndPassword,
		getAuth,
		sendEmailVerification,
		sendPasswordResetEmail,
	} from 'firebase/auth';
	import { FirebaseError } from 'firebase/app';
	import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-svelte';
	import { Button, Input, Label, Card, Helper, Toast } from 'flowbite-svelte';

	import { getClientApp } from '$lib/firebase/client';
	import { user } from '../store/store';

	let option: 'login' | 'register' | 'recover' = 'login';

	let username: string = '';
	let email: string = '';
	let password: string = '';
	let repeatPassword: string = '';
	let pwVisible: boolean = false;
	let validatorError: boolean = true;

	let open: boolean = false;
	let color: 'green' | 'red' | 'yellow' = 'green';
	
	enum ToastMessages {
		INVALID_EMAIL_ERROR = 'Email non valida',
		ALREADY_USED_EMAIL_ERROR = 'Email già in uso',
		WEAK_PASSWORD_ERROR = 'Password troppo debole',
		INVALID_CREDENTIAL_ERROR = 'Credenziali non valide',
		NETWORK_REQUEST_FAILED_ERROR = 'Errore di rete',
		UNKNOWN_ERROR = 'Errore sconosciuto',
		EMAIL_VERIFICATION_SENT = 'Email inviata',
	}
	
	let toastMessage: ToastMessages = ToastMessages.UNKNOWN_ERROR;
	let lessThanEightChars = false;
	let noUpperCase = false;
	let noNumber = false;
	let noSpecialChar = false;

	$: {
		if (validatorError) {
			validatorError = !(password === repeatPassword);
		}

		if(option === 'register'){
			if (lessThanEightChars)
				lessThanEightChars = password.length < 8;

			if (noUpperCase)
				noUpperCase = !/[A-Z]/.test(password);

			if (noNumber)
				noNumber = !/[0-9]/.test(password);

			if (noSpecialChar)
				noSpecialChar = !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
		}
		
	}

	const sendEmail = async () => {
		const actionSettings: ActionCodeSettings = {
			url: 'https://fdp-app.vercel.app/',
		};
		
		if(option === 'register')
			await sendEmailVerification($user!, actionSettings);
		else if(option === 'recover')
			await sendPasswordResetEmail(getAuth(getClientApp()), email, actionSettings);

		toastMessage = ToastMessages.EMAIL_VERIFICATION_SENT;
		open = true;

		const timeOut = setTimeout(() => {
			open = false;
			clearTimeout(timeOut);
		}, 3500);

		color = 'green';
	}

	const handleSubmission = async () => {
		if (option === 'login') {
			try {
				const credential = await signInWithEmailAndPassword(getAuth(getClientApp()), email, password);
				const token = await credential.user.getIdToken();

				const userSessuion = await fetch('/api/session',
					{
						method: 'POST',
						headers: {
							authorization: `Bearer ${token}`,
						}
					}
				);

				$user = credential.user;
			} catch (error) {
				if((error as FirebaseError).code === 'auth/invalid-email'){
					toastMessage = ToastMessages.INVALID_EMAIL_ERROR;
				}
				else if((error as FirebaseError).code === 'auth/invalid-credential'){
					toastMessage = ToastMessages.INVALID_CREDENTIAL_ERROR;
				}
				else if((error as FirebaseError).code === 'auth/network-request-failed'){
					toastMessage = ToastMessages.NETWORK_REQUEST_FAILED_ERROR;
				}
				else{
					toastMessage = ToastMessages.UNKNOWN_ERROR;
				}
				open = true;

				const timeOut = setTimeout(() => {
					open = false;
					clearTimeout(timeOut);
				}, 3500);

				color = 'red';
			}
		} else if(option === 'register') {
			try {
				const userCredential = await createUserWithEmailAndPassword(
					getAuth(getClientApp()),
					email,
					password
				);

				const token = await userCredential.user.getIdToken();
				await fetch('/api/session',
					{
						method: 'POST',
						headers: {
							authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ name: username })
					}
				);
				$user = userCredential.user;

				await sendEmail();
			} catch (error) {
				if((error as FirebaseError).code === 'auth/invalid-email'){
					toastMessage = ToastMessages.INVALID_EMAIL_ERROR;
				}
				else if((error as FirebaseError).code === 'auth/email-already-in-use'){
					toastMessage = ToastMessages.ALREADY_USED_EMAIL_ERROR;
				}
				else if((error as FirebaseError).code === 'auth/weak-password'){
					toastMessage = ToastMessages.WEAK_PASSWORD_ERROR;
				}
				else if((error as FirebaseError).code === 'auth/network-request-failed'){
					toastMessage = ToastMessages.NETWORK_REQUEST_FAILED_ERROR;
				}
				else{
					toastMessage = ToastMessages.UNKNOWN_ERROR;
				}
				open = true;

				const timeOut = setTimeout(() => {
					open = false;
					clearTimeout(timeOut);
				}, 3500);

				color = 'red';
			}
		}
		else if(option === 'recover'){
			try{
				await sendEmail();
			}
			catch(error){
				if((error as FirebaseError).code === 'auth/invalid-email'){
					toastMessage = ToastMessages.INVALID_EMAIL_ERROR;
				}
				else if((error as FirebaseError).code === 'auth/network-request-failed'){
					toastMessage = ToastMessages.NETWORK_REQUEST_FAILED_ERROR;
				}
				else{
					toastMessage = ToastMessages.UNKNOWN_ERROR;
				}
				open = true;

				const timeOut = setTimeout(() => {
					open = false;
					clearTimeout(timeOut);
				}, 3500);

				color = 'red';
			}
		}
	};

	onAuthStateChanged(getAuth(getClientApp()), (user) => {
		$user = user;
	});

	$: disableButton = validatorError || (option === 'register' && (lessThanEightChars || noUpperCase || noNumber || noSpecialChar)) || (option === 'recover' && email === '');
</script>

{#if $user === null}
	<Card class="flex w-full max-w-96 flex-col items-center justify-center">
		<div class="mb-5 flex w-full justify-around">
			<button
				on:click={() => (option = 'login')}
				class="w-[40%] border-b-2 {option == 'login'
					? 'border-primary-500 text-black dark:text-white'
					: 'border-transparent'} pb-3">Login</button
			>
			<button
				on:click={() => (option = 'register')}
				class="w-[40%] border-b-2 {option == 'register'
					? 'border-primary-500 text-black dark:text-white'
					: 'border-transparent'} pb-3">Registrati</button
			>
		</div>

		<div class="flex w-full flex-col gap-3">
			<h1 class="w-max text-3xl font-semibold text-primary-600">
				{option === 'login' ? 'Accedi' : (option === 'register' ? 'Registrati' : 'Recupera password')}
			</h1>

			{#if option === 'register'}
				<Label>
					Nome utente
					<Input
						name="username"
						bind:value={username}
						class="mt-2"
					/>
				</Label>
			{/if}

			<Label>
				Email
				<Input
					type="email"
					placeholder="john.doe@company.com"
					bind:value={email}
					required
					class="mt-2"
				/>
			</Label>

			{#if option !== 'recover'}
				<Label>
					Password
					<Input
						id="password"
						name="password"
						type={pwVisible ? 'text' : 'password'}
						bind:value={password}
						on:blur={() => {
							lessThanEightChars = password.length < 8;
							noUpperCase = !/[A-Z]/.test(password);
							noNumber = !/[0-9]/.test(password);
							noSpecialChar = !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)
						}}
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
					{#if option === 'register'}
						{#if lessThanEightChars}
							<Helper class="mt-1 flex items-center gap-1" color='gray'>
								<svelte:component this={lessThanEightChars ? XCircle : CheckCircle2} class="w-3 h-3"/>
								La password deve contenere almeno 8 caratteri
							</Helper>
						{/if}
						{#if noUpperCase}
							<Helper class="mt-1 flex items-center gap-1" color='gray'>
								<svelte:component this={noUpperCase ? XCircle : CheckCircle2} class="w-3 h-3"/>
								La password deve contenere almeno una lettera maiuscola
							</Helper>
						{/if}
						{#if noNumber}
							<Helper class="mt-1 flex items-center gap-1" color='gray'>
								<svelte:component this={noNumber ? XCircle : CheckCircle2} class="w-3 h-3"/>
								La password deve contenere almeno un numero
							</Helper>
						{/if}
						{#if noSpecialChar}
							<Helper class="mt-1 flex items-center gap-1" color='gray'>
								<svelte:component this={noSpecialChar ? XCircle : CheckCircle2} class="w-3 h-3"/>
								La password deve contenere almeno un carattere speciale
							</Helper>
						{/if}
					{/if}
				</Label>
			{/if}

			{#if option === 'register'}
				<Label>
					Conferma password
					<Input
						name="password"
						type={pwVisible ? 'text' : 'password'}
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
							on:click={() => (pwVisible = !pwVisible)}
						>
							{#if pwVisible}
								<EyeOff />
							{:else}
								<Eye />
							{/if}
						</button>
					</Input>
					{#if validatorError}
					<Helper class="mt-1 flex items-center gap-1" color='gray'>
						<svelte:component this={noSpecialChar ? XCircle : CheckCircle2} class="w-3 h-3"/>
						Le password non corrispondono
					</Helper>
					{/if}
				</Label>
			{/if}

			{#if option !== 'recover'}
				<button class="text-sm hover:text-primary-500 p-0 w-max self-end mt-1" on:click={() => option = 'recover'}>Password dimenticata?</button>
			{/if}
			<Button class="mt-3 w-full" on:click={handleSubmission} bind:disabled={disableButton}
				>{option === 'login' ? 'Accedi' : (option === 'register' ? 'Registrati' : 'Invia Email di recupero')}</Button
			>
		</div>
	</Card>
{:else if !$user?.emailVerified}
	<div>
		<p>Ti è stata mandata una mail di verifica all'indirizzo {$user?.email}</p>
		<p>Controlla la tua casella di posta elettronica e clicca sul link per confermare la tua email.</p>
		<p>Se non hai ricevuto la mail di verifica, clicca <button on:click={sendEmail} class="text-primary-500">qui</button> per richiederne un'altra.</p>
	</div>
{/if}

<Toast on:close={() => open = false} bind:open color={color} class="w-max mt-10 mb-5 mx-auto right-0 left-0 fixed top-20" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<svelte:component this={toastMessage !== ToastMessages.EMAIL_VERIFICATION_SENT ? XCircle : CheckCircle2} class="w-6 h-6  text-{color}-400" slot="icon"/>
	<span class={`text-${color}-400 font-semibold`}>{toastMessage}</span>
</Toast>