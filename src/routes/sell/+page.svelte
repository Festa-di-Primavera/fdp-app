<script lang="ts">
	import QrReader from "../../components/QrReader.svelte";
	import NavBar from "../../components/NavBar.svelte";
	import { FloatingLabelInput, DarkMode, Button, Label, Input } from "flowbite-svelte"
	import { enhance } from "$app/forms";

	let x: string;
</script>

<section class="w-full h-full flex flex-col items-center gap-4 ">
	<div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96">
		<h1 class="text-primary-600 font-bold text-4xl">SELL</h1>
		<p class="dark:text-white">Questa è la pagina di vendita</p>
		<form method="post" class="flex flex-col gap-4 w-full" use:enhance>
			<Label class="text-primary-600 dark:text-white font-medium text-md">
				Nome
				<Input class="mt-1" name="name"/>
			</Label>
			<Label class="text-primary-600 dark:text-white font-medium text-md">
				Cognome
				<Input class="mt-1" name="surname"/>
			</Label>
			<Label class="text-primary-600 dark:text-white font-medium text-md">
				Codice Biglietto
				<Input class="mt-1" bind:value={x} name="code"/>
			</Label>

			<Button class="w-full mt-6" type="submit">Vendi</Button>
		</form>
		<div class="w-full flex items-center justify-center">
			<QrReader bind:codeResult={x}/>
		</div>
    </div>
</section>
