<script lang="ts">
    import { getEnumValueFromString } from "$lib/utils/enums";
    import { OFFSET } from "$lib/utils/tickets";
    import { ItemType, Sauce, type Order } from "$models/order";
    import { Button, Fileupload, Label, NumberInput } from "flowbite-svelte";
    import Papa from "papaparse";

    let processing = $state(false);
    let results: { success: boolean; message: string }[] = $state([]);
    let rowIndex = $state(1);

    async function handleFileUpload(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        processing = true;
        results = [];

        Papa.parse(file, {
            complete: async (result) => {
                try {
                    for (const row of result.data as string[][]) {
                        if (row.length < 7) continue; // Skip invalid rows

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

                        // Validate enum values before proceeding
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
                            timestamp: Date.now(),
                            ticketId: `XNRF${OFFSET + rowIndex}/25`,
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
                            console.log("Order saved:", order);
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

                            console.log("Email sent:", emailResp);
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

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Carica ordini da CSV</h1>

    <div class="mb-4 flex- col">
        <Label>
            Codice di partenza
            <NumberInput bind:value={rowIndex} class="w-24" />
        </Label>
        <Fileupload
            accept=".csv"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <Button onclick={handleFileUpload} class="mt-2">Carica</Button>
    </div>

    {#if processing}
        <div class="text-blue-600">Elaborazione in corso...</div>
    {/if}

    <div class="mt-4">
        {#each results as result}
            <div
                class="p-2 mb-2 rounded {result.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'}"
            >
                {result.message}
            </div>
        {/each}
    </div>
</div>
