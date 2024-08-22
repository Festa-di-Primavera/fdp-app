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
</script>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
    <div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow">
        {#if $user}
            <h1 class="text-primary-600 font-bold text-4xl">Reset Password</h1>
            <p class="dark:text-white text-justify">
                Inserisci la mail a cui deve essere inviato il link per il reset della password
            </p>
			<form use:enhance method="post" action="?/resetPassword" class="w-full flex flex-col items-center">
				<Label class="w-full">
					Email
					<Input class="mt-2" name="email" autocomplete="off" placeholder="example@email.com"/>
				</Label>
			
				<Button type="submit" class="mt-5 w-[90%]">Invia email</Button>
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
