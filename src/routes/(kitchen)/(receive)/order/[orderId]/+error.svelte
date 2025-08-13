<script lang="ts">
    import { page } from "$app/state";
    import * as Alert from "$lib/components/ui/alert/index";
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import { CircleAlertIcon, House, Info } from "@lucide/svelte";

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

<section class="flex h-full w-full flex-grow flex-col items-center py-8 px-5">
    <Card.Root class="max-w-lg w-full">
        <Card.Content>
            {#if error?.message}
                <Alert.Root variant="destructive" class="mb-6">
                    <CircleAlertIcon />
                    <Alert.Title>{getErrorMessage(status)}</Alert.Title>
                    <Alert.Description>
                        <p>{getErrorDescription(status)}</p>
                    </Alert.Description>
                </Alert.Root>
                <Alert.Root>
                    <Info />
                    <Alert.Title>Dettagli dell'errore:</Alert.Title>
                    <Alert.Description class="font-mono">
                        <p>
                            {error?.message ||
                                "Si è verificato un errore sconosciuto."}
                        </p>
                    </Alert.Description>
                </Alert.Root>
            {/if}

            <Card.Footer class="mt-6 flex justify-center">
                <Button href="/" class="flex items-center">
                    <House />
                    Torna alla home
                </Button>
            </Card.Footer>
        </Card.Content>
    </Card.Root>
</section>
