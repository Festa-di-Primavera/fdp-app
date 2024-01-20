<script lang="ts">
	import QrReader from "../../components/QrReader.svelte";
	import { Button, Label, Input, Helper } from "flowbite-svelte"
	import { enhance } from "$app/forms";
	import { Ticket } from 'lucide-svelte';

	let ticketCode: string;
</script>

<section class="w-full h-full flex flex-col items-center gap-4 ">
	<div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12">
		<h1 class="text-primary-600 font-bold text-4xl">Vendi</h1>
		<p class="dark:text-white text-justify">Inserire nome, cognome e, scansionando il QR, il codice del biglietto.</p>
		<form method="post" class="flex flex-col gap-4 w-full" use:enhance>
			<Label class="text-black dark:text-white font-medium text-md">
				Nome <span class="text-primary-700">*</span>
				<Input required class="mt-1" name="name" autocomplete="off"/>
			</Label>
			<Label class="text-black dark:text-white font-medium text-md">
				Cognome <span class="text-primary-700">*</span>
				<Input required class="mt-1" name="surname" autocomplete="off"/>
			</Label>
			<Label class="text-black dark:text-white font-medium text-md">
				Codice Biglietto <span class="text-primary-700">*</span>
				<Input required class="mt-1" bind:value={ticketCode} name="code" autocomplete="off">
					<Ticket slot="left" class="w-6 h-6 text-primary-600 dark:text-white"/>
				</Input>
			</Label>

			<div class="w-full mt-6 flex items-center justify-center">
				<QrReader bind:codeResult={ticketCode}/>
			</div>
			<Button class="w-full mt-6" type="submit">Vendi</Button>
		</form>
    </div>
</section>
