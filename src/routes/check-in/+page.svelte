<script lang="ts">
	import QrReader from "../../components/QrReader.svelte";

	let ticketCode: string;
</script>

<section class="w-full h-full flex flex-col items-center gap-4 ">
	<div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12">
		<h1 class="text-primary-600 font-bold text-4xl">Check-in</h1>
		<p class="dark:text-white text-justify">Scansionare il QR e verificare la validità del biglietto</p>
		<div >
			<div class="w-full my-6 flex items-center justify-center">
				<QrReader bind:codeResult={ticketCode}/>
			</div>

            <div class="w-full flex flex-col">
                <span class="text-black dark:text-white">
                    Codice biglietto: {ticketCode}
                </span>
                <span class="text-black dark:text-white">
                    Nome e Cognome: 
                </span>
                <span class="text-black dark:text-white">
                    Ingresso: 
                </span>
            </div>

		</div>
    </div>
</section>
