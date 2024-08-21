<script lang="ts">
	import { Button, Input, Label, Spinner } from "flowbite-svelte";
	import type { User } from "lucia";
	import { user } from "../../../store/store";
	import { enhance } from "$app/forms";
	import FeedbackToast from "../../../components/feedbacks/FeedbackToast.svelte";
	import { XCircle } from "lucide-svelte";

	export let data: User;
	if(!$user)
		$user = data;

	let feedbackToastOpen: boolean = false;
	let color: 'green' | 'red' | 'yellow' = 'green';
	let timeOut: NodeJS.Timeout;
	let toastMessage: string = '';

	export let form;
	$: if(form && form.error){
		color = 'red';
		toastMessage = form.message;
		feedbackToastOpen = true;
		timeOut = setTimeout(() => {
			feedbackToastOpen = false;
			clearTimeout(timeOut);
		}, 3500);
	}

	const code = ['','','','','',''];

	const onInput = (e: Event, index: number) => {
		const target = e.target as HTMLInputElement;
		const value = target.value = target.value.toUpperCase();  // Forziamo a maiuscolo

		// Accettiamo solo numeri o lettere maiuscole
		if (!/^[0-9A-Z]$/.test(value)) {
			target.value = '';  // Cancelliamo l'input se non valido
			return;
		}

		code[index] = value;  // Salviamo il valore nel codice

		// Spostiamo il focus al prossimo input se esiste
		const nextInput = target.nextElementSibling as HTMLInputElement;
		if (nextInput) {
			nextInput.focus();
		}
	};

	const onKeyDown = (e: KeyboardEvent, index: number) => {
		const target = e.target as HTMLInputElement;

		// Se premiamo Backspace
		if (e.key === 'Backspace') {
			if (target.value !== '') {
				// Se l'input non è vuoto, cancelliamo il valore attuale
				target.value = '';
				code[index] = '';  // Aggiorniamo il codice cancellando questo indice
			} else if (index > 0) {
				// Se l'input è già vuoto, spostiamo il focus al campo precedente
				const prevInput = target.previousElementSibling as HTMLInputElement;
				if (prevInput) {
					prevInput.focus();
					prevInput.value = '';  // Cancelliamo anche il campo precedente
					code[index - 1] = '';  // Aggiorniamo il codice
				}
			}
		}
	};

	const onPaste = (e: ClipboardEvent) => {
		const target = e.target as HTMLInputElement;
		const pasteData = e.clipboardData?.getData('text').toUpperCase();

		// Extract the first 6 characters from the pasted text
		const validData = pasteData?.slice(0, 6).replace(/[^0-9A-Z]/g, '');

		if (validData) {
			// Distribute the characters across the inputs
			for (let i = 0; i < validData.length && i < 6; i++) {
				code[i] = validData[i];
				const inputElement = document.getElementById(`code${i}`) as HTMLInputElement;
				if (inputElement) {
					inputElement.value = validData[i];
				}
			}

			// Set focus to the next input after the last pasted character
			const nextInput = document.getElementById(`code${validData.length}`) as HTMLInputElement;
			if (nextInput) {
				nextInput.focus();
			}

			// Prevent the default paste behavior
			e.preventDefault();
		}
	};
</script>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
    <div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow">
        {#if $user}
            <h1 class="text-primary-600 font-bold text-4xl">Verifica Email</h1>
            <p class="dark:text-white text-justify">
                Inserisci il codice di verifica ricevuto all'email <b class="text-primary-300">{$user.email}</b> per verificare il tuo account
            </p>
			<form use:enhance method="post" action="?/resend" class="dark:text-white text-justify">
				Se non hai ricevuto il codice, <button class="text-primary-600 font-semibold">clicca qui</button> per richiederne un altro
			</form>
			<Label class="text-black dark:text-white font-medium text-md flex justify-between w-full">
				{#each code as _, index}
				<Input 
				on:input={(e) => onInput(e, index)} 
				on:keydown={(e) => onKeyDown(e, index)}
				on:paste={onPaste}
				bind:value={code[index]}
				maxlength="1" 
				class="w-12 aspect-square text-center rounded-md border-2 border-muted" 
				pattern="[0-9A-Z]" 
				id="code{index}" 
				name="code{index}"
				autocomplete="off"
				style="caret-color: transparent;"
				/>
				{/each}
			</Label>
			
			<form use:enhance method="post" action="?/verify" class="w-full flex flex-col items-center">
				<input type="hidden" name="code" value={code.join('')}/>
				<Button type="submit" class="mt-5 w-[90%]">Verifica</Button>
            </form>
        {:else}
            <div class="w-full flex flex-col flex-grow gap-5 items-center justify-center mt-10">
                <Spinner size="sm" class="max-w-12 self-center"/>
                <span class="text-primary-600 font-semibold text-2xl">Attendere...</span>
            </div>
        {/if}
    </div>
</section>

<FeedbackToast
	bind:open={feedbackToastOpen}
	bind:color
	bind:message={toastMessage}
	icon={XCircle}
/>
