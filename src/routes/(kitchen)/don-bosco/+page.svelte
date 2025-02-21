<script lang="ts">
    import { ItemType, Sauce, type Order } from "$models/order";
    import Papa from "papaparse";
    import { getEnumValueFromString } from "$lib/utils/enums";
    import { OFFSET } from "$lib/utils/tickets";

    let processing = false;
    let results: { success: boolean; message: string }[] = [];

    async function handleFileUpload(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        processing = true;
        results = [];

        Papa.parse(file, {
            complete: async (result) => {
                let rowIndex = 1;
                for (const row of result.data as string[][]) {
                    // TODO: remove notes
                    if (row.length < 7) continue; // Skip invalid rows

                    const [name, surname, email, orderItem, sauce, glutenFree, notes] =
                        row;
                    if (!name || !surname || !orderItem) continue;

                    try {
                        const order: Order = {
                            name: `${name.trim()} ${surname.trim().charAt(0)}.`,
                            items: [
                                {
                                    quantity: 1,
                                    type: getEnumValueFromString(
                                        ItemType,
                                        orderItem.trim()
                                    ),
                                    ready: false,
                                    sauce:
                                        getEnumValueFromString(
                                            Sauce,
                                            sauce.trim().toUpperCase()
                                        ) || undefined,
                                    glutenFree:
                                        glutenFree.toLowerCase() === "true",
                                    // TODO: remove notes
                                    notes: notes.trim() || undefined,
                                },
                            ],
                            done: true,
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

                            const emailResp = await fetch("/api/order/don-bosco", {
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
                            });

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
                    } catch (error: any) {
                        results = [
                            {
                                success: false,
                                message: `Errore per ${name}: ${error.message}`,
                            },
                            ...results,
                        ];
                    }
                    await new Promise((resolve) => setTimeout(resolve, 1600));
                }
                processing = false;
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

    <div class="mb-4">
        <input
            type="file"
            accept=".csv"
            onchange={handleFileUpload}
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
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
