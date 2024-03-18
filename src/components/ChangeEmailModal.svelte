<script lang="ts">
	import { Button, Input, Label, Modal, Toast } from "flowbite-svelte";
	import { CheckCircle2, XCircle } from "lucide-svelte";
	import { user } from "../store/store";
	import { verifyBeforeUpdateEmail } from "firebase/auth";
	import type { FirebaseError } from "firebase/app";
	import FeedbackToast from "./feedbacks/FeedbackToast.svelte";

	export let changeEmailModalOpen: boolean = false;

	let color: 'green' | 'red' | 'yellow' = 'green';
	let toastMessage: string = '';
	let error: boolean = false;
	let feedbackToastOpen: boolean = false;
	let timeOut: NodeJS.Timeout;

	let value: string = '';
	$: disableButton = value === '';
	$: toastIcon = error ? XCircle : CheckCircle2;

	async function changeEmail(){
		if(value === $user?.email){
			color = 'yellow';
			error = true;
			toastMessage = 'Nessuna modifica effettuata';
			feedbackToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
			return;
		}

		try{
			await verifyBeforeUpdateEmail($user!, value);

			color = 'green';
			toastMessage = 'Email di verifica inviata al nuovo indirizzo';
			feedbackToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
		}
		catch(e){
			error = true;
			toastMessage = (e as FirebaseError).message;
			switch((e as FirebaseError).code){
				case 'auth/invalid-new-email':
					toastMessage = 'Email non valida';
					break;
				case 'auth/email-already-in-use':
					toastMessage = 'Email già in uso';
					break;
				default:
					toastMessage = (e as FirebaseError).message;
					break;
			}

			color = 'red';
			feedbackToastOpen = true;
			clearTimeout(timeOut);
			timeOut = setTimeout(() => {
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 3500);
		}
	}
</script>

<Modal outsideclose autoclose title="Cambia password" size="sm" bind:open={changeEmailModalOpen} on:close={() => changeEmailModalOpen = false} class="z-50">
	<div class="w-full flex flex-col gap-5 items-center justify-center">
		<Label class="w-full">
			Nuova email
			<Input
				name="email"
				bind:value
				class="mt-2"
			/>
		</Label>
	</div>
	<svelte:fragment slot="footer">
		<Button on:click={changeEmail} disabled={disableButton}>
			Conferma
		</Button>
		<Button color="alternative" on:click={() => changeEmailModalOpen = false}>
			Annulla
		</Button>
	</svelte:fragment>
</Modal>

<FeedbackToast
	bind:open={feedbackToastOpen}
	bind:color
	bind:message={toastMessage}
	bind:icon={toastIcon}
	onclose={() => {value = ''}}
/>
