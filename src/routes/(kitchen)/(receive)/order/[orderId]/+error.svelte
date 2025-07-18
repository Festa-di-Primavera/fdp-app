<script lang="ts">
    import { Alert, Button, Card } from "flowbite-svelte";
    import { page } from "$app/state";
    
    // Get the error from the page store
    const { status, error } = page;
    
    // Map status codes to friendly messages
    function getErrorMessage(status: number): string {
        switch (status) {
            case 404:
                return "Ordine non trovato";
            case 400:
                return "ID ordine non valido";
            default:
                return "Si è verificato un errore";
        }
    }
    
    // Get a detailed explanation based on the status
    function getErrorDescription(status: number): string {
        switch (status) {
            case 404:
                return "L'ordine che stai cercando non esiste o potrebbe essere stato cancellato.";
            case 400:
                return "L'ID dell'ordine che hai fornito non è valido. Controlla di aver utilizzato il link corretto.";
            default:
                return "Si è verificato un errore durante il recupero dell'ordine. Riprova più tardi o contatta l'assistenza.";
        }
    }
</script>

<section class="flex h-full w-full flex-grow flex-col items-center py-8">
    <Card class="max-w-lg w-full dark:bg-neutral-700 dark:border-neutral-500 p-16">
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                {getErrorMessage(status)}
            </h1>
            <div class="text-gray-600 dark:text-gray-400">
                <p>{getErrorDescription(status)}</p>
                {#if error?.message}
                    <Alert color="red" class="mt-4 text-left font-mono dark:bg-neutral-800 dark:border-neutral-500">
                        <b>Dettagli errore:</b> {error.message}
                    </Alert>
                {/if}
            </div>
        </div>

        <div class="flex justify-center">
            <Button href="/">
                Torna alla home
            </Button>
        </div>
    </Card>
</section>
