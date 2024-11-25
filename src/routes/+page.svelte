<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from 'flowbite-svelte';
	import { AlertCircle, LogOut, XCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import FeedbackToast from '../components/feedbacks/FeedbackToast.svelte';
	import { enhance } from '$app/forms';
	import { user } from '$store/store';
	import type { User } from "$lib/auth/user";

	export let data;
	$user = data as User;

	let feedbackToastMessage: string = '';
	let feedbackToastOpen: boolean = false;
	let error: boolean = false;
	let color: 'red' | 'yellow';

	$: color = error ? 'red' : 'yellow';
	$: ToastIcon = error ? AlertCircle : XCircle;

	onMount(async () => {
		if (window.location.search.split('?')[1] == 'checkOutExpired') {
			feedbackToastMessage = 'Non è possibile fare check-out';
			error = false;
			feedbackToastOpen = true;
			goto(window.location.pathname);
			const timeOut = setTimeout(() => {
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 4000);
		} else if (window.location.search.split('?')[1] == 'checkInExpired') {
			feedbackToastMessage = 'Non è possibile fare check-in';
			error = false;
			feedbackToastOpen = true;
			goto(window.location.pathname);
			const timeOut = setTimeout(() => {
				feedbackToastOpen = false;
				clearTimeout(timeOut);
			}, 4000);
		}
	});
</script>

<svelte:head>
	<title>Festa di Primavera</title>
</svelte:head>

<section
	class="flex w-full flex-grow flex-col items-center justify-start px-5 py-10 text-xl text-black dark:text-white"
>
	<div class="flex flex-col items-center">
		<div class="flex flex-col items-center gap-4 text-center">
			<h1 class="text-3xl font-semibold text-primary-600">Home</h1>
			<p class="text-center text-2xl">Ciao <b>{data?.username}</b>!</p>
			<p class="text-center">Questa è solo la home page!</p>
			<p class="flex items-end">
				Per iniziare ad usare l'applicazione usa il menu in alto a destra
			</p>
			<form method="post" use:enhance class="mt-5 flex flex-col items-center gap-8 text-center">
				Se invece vuoi uscire dall'applicazione, clicca qui sotto
				<Button
					type="submit"
					color="red"
					class="flex items-center justify-center gap-2"
				>
					Esci dall'app
					<LogOut class="h-4 w-4" />
				</Button>
			</form>
		</div>
	</div>
</section>

<FeedbackToast
	bind:open={feedbackToastOpen}
	bind:color
	bind:message={feedbackToastMessage}
	bind:ToastIcon
/>
