<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { getEnumValueFromString } from "$lib/utils/enums";
    import { OFFSET } from "$lib/utils/tickets";
    import { ItemType, Sauce, type Order } from "$models/order";
    import Papa from "papaparse";

    let processing = $state(false);
    let results: { success: boolean; message: string }[] = $state([]);
    let rowIndex = $state(1);
    let files= $state<FileList>();

    async function handleFileUpload() {
        if (!files) {
            console.error("File input is not initialized.");
            return;
        }
        const file = files?.[0];
        if (!file) return;

        processing = true;
        results = [];

        Papa.parse(file, {
            complete: async (result) => {
                try {
                    for (const row of result.data as string[][]) {
                        if (row.length < 7) continue;

                        const [
                            name,
                            surname,
                            email,
                            orderItem,
                            sauce,
                            glutenFree,
                            notes,
                        ] = row;
                        if (!name || !surname || !orderItem) continue;

                        const itemType = getEnumValueFromString(
                            ItemType,
                            orderItem.trim()
                        );
                        if (!itemType) {
                            // Stop everything if we find an invalid item type
                            throw new Error(
                                `Tipo ordine non valido nella riga per ${name} ${surname}: "${orderItem}"`
                            );
                        }

                        const sauceType = sauce.trim()
                            ? getEnumValueFromString(
                                  Sauce,
                                  sauce.trim().toUpperCase()
                              )
                            : undefined;
                        if (sauce.trim() && !sauceType) {
                            // Stop everything if we find an invalid sauce
                            throw new Error(
                                `Tipo salsa non valido nella riga per ${name} ${surname}: "${sauce}"`
                            );
                        }

                        const order: Order = {
                            name: `${name.trim()}`,
                            surname: surname.trim(),
                            email: email.trim(),
                            items: [
                                {
                                    quantity: 1,
                                    type: itemType,
                                    ready: false,
                                    sauce: sauceType,
                                    glutenFree:
                                        glutenFree.toLowerCase() === "true",
                                    notes: notes.trim() || undefined,
                                },
                            ],
                            done: null,
                            creationDate: new Date(Date.now()),
                            ticketId: `XNRF${OFFSET + rowIndex}`,
                        };
                        rowIndex++;

                        const response = await fetch("/api/order", {
                            method: "POST",
                            body: JSON.stringify(order),
                            headers: {
                                "Content-Type": "application/json",
                            },
                        });

                        if (response.ok) {
                            results = [
                                {
                                    success: true,
                                    message: `Ordine creato per ${order.name}`,
                                },
                                ...results,
                            ];

                            const emailResp = await fetch(
                                "/api/order/don-bosco",
                                {
                                    method: "POST",
                                    body: JSON.stringify({
                                        name: name.trim(),
                                        surname: surname.trim(),
                                        email: email.trim(),
                                        order,
                                    }),
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                }
                            );
                        } else {
                            const error = await response.json();
                            results = [
                                {
                                    success: false,
                                    message: `Errore per ${name}: ${error.message}`,
                                },
                                ...results,
                            ];
                        }

                        await new Promise((resolve) =>
                            setTimeout(resolve, 1600)
                        );
                    }
                } catch (error: any) {
                    // This will catch any error from the for loop, including our enum validation errors
                    results = [
                        {
                            success: false,
                            message: `Elaborazione interrotta: ${error.message}`,
                        },
                        ...results,
                    ];
                } finally {
                    processing = false;
                }
            },
            error: (error) => {
                console.error("Error parsing CSV:", error);
                processing = false;
            },
        });
    }
</script>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
    <div class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5">
        <h1 class="text-4xl font-bold text-app-accent">Carica ordini da CSV</h1>
        <p class="text-justify dark:text-white text-base mb-2">
            Seleziona il file CSV con gli ordini. Il formato deve essere: <br>
            <span class="font-mono text-xs">nome, cognome, email, tipo ordine, salsa, senza glutine, note</span>
        </p>
        <div class="w-full flex flex-col gap-4">
            <div>
                <Label for="rowIndex" class="text-md font-medium">Codice di partenza <span class="text-app-accent">*</span></Label>
                <Input id="rowIndex" type="number" bind:value={rowIndex} class="w-24" placeholder="1" min="1" />
            </div>
            <div>
                <Label for="csv-upload" class="text-md font-medium">File CSV <span class="text-app-accent">*</span></Label>
                <Input id="csv-upload" type="file" accept=".csv" bind:files={files} class="file:bg-accent file:text-app-accent" />
            </div>
            <Button class="mt-2 w-full" disabled={processing || !files || files.length === 0} onclick={handleFileUpload}>
                {processing ? "Elaborazione..." : "Carica ordini"}
            </Button>
        </div>
        {#if processing}
            <div class="text-blue-600 mt-2">Elaborazione in corso, attendi...</div>
        {/if}
        {#if results.length > 0}
            <div class="mt-4 w-full flex flex-col gap-2">
                {#each results as result}
                    <div class="p-2 rounded text-sm font-medium flex items-center gap-2 {result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        {#if result.success}
                            <span class="inline-block">
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                            </span>
                        {:else}
                            <span class="inline-block">
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </span>
                        {/if}
                        {result.message}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</section>
