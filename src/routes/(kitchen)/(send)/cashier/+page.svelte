<script lang="ts">
    import { Button, Card, Input, Label } from "flowbite-svelte";
    import {
        Check,
        PencilLine,
        Send,
        Ticket as TicketIcon,
        Trash2,
        X,
    } from "lucide-svelte";

    import QrReader from "$components/QrReader.svelte";
    import OrderModal from "$components/food/cashier/OrderModal.svelte";
    import type { User } from "$lib/auth/user";
    import { getXnrfCode } from "$lib/utils/tickets";
    import { type Order, type OrderItem, ItemType } from "$models/order";
    import type { Ticket } from "$models/ticket";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    if (!$user) $user = data;

    let ticketCode: string = $state("");
    let ticketCodeInput: string = $state("");

    let ticket: Ticket | undefined = $state();

    async function getTicket(code: string) {
        const res = await fetch(`/api/tickets/${encodeURIComponent(code)}`);
        ticketCodeInput = "";

        if (res.status == 404 || res.status == 402 || res.status == 425) {
            toast.error(
                res.status === 402
                    ? "Biglietto non ancora venduto"
                    : res.status === 425
                      ? "Biglietto non ancora validato all'ingresso"
                      : "Codice biglietto errato"
            );
            return;
        }

        let ticketResponse = (await res.json()).ticket;

        ticket = {
            ticketId: getXnrfCode(code) || "",
            name: ticketResponse.name,
            surname: ticketResponse.surname,
            seller: res.status !== 206 ? ticketResponse.seller : "Non Trovato",
            soldAt: ticketResponse.soldAt,
            checkIn: ticketResponse.checkIn,
        };
    }

    const reset = () => {
        ticket = undefined;
        ticketCodeInput = "";
        ticketCode = "";
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && ticketCodeInput !== "") {
            getTicket(ticketCodeInput);
        }
    };

    $effect(() => {
        if (ticketCode !== "") {
            getTicket(ticketCode);
        } else {
            reset();
        }
    });

    let orderItems: OrderItem[] = $state([]);
    let showModal = $state(false);
    let currentItem: OrderItem = $state({
        type: ItemType.ONTO,
        quantity: 1,
        removedIngredients: [],
        addedSauces: [],
    });

    let isEditing = $state(false);
    let editingIndex = $state(-1);

    function openOrderModal(type: string) {
        currentItem = {
            type: type as ItemType,
            quantity: 1,
            removedIngredients: [],
            glutenFree: false,
        };
        isEditing = false;
        showModal = true;
    }

    function areOrderItemsEqual(a: OrderItem, b: OrderItem): boolean {
        return (
            a.type === b.type &&
            a.glutenFree === b.glutenFree &&
            JSON.stringify(a.removedIngredients?.sort()) ===
                JSON.stringify(b.removedIngredients?.sort())
        );
    }

    function removeFromOrder(displayIndex: number) {
        // Converte l'indice di display nell'indice effettivo nell'array
        const actualIndex = orderItems.length - 1 - displayIndex;
        orderItems = orderItems.filter((_, i) => i !== actualIndex);
    }

    function editOrder(displayIndex: number) {
        // Converte l'indice di display nell'indice effettivo nell'array
        const actualIndex = orderItems.length - 1 - displayIndex;
        currentItem = { ...orderItems[actualIndex] };
        isEditing = true;
        editingIndex = actualIndex;
        showModal = true;
    }

    function addToOrder() {
        if (isEditing) {
            // In modalità modifica, mantieni la posizione originale
            orderItems = orderItems.map((item, index) =>
                index === editingIndex ? { ...currentItem } : item
            );
        } else {
            // Cerca un ordine identico esistente
            const existingIndex = orderItems.findIndex((item) =>
                areOrderItemsEqual(item, currentItem)
            );

            if (existingIndex !== -1) {
                // Aggiorna la quantità dell'ordine esistente
                orderItems = orderItems.map((item, index) =>
                    index === existingIndex
                        ? {
                              ...item,
                              quantity: item.quantity + currentItem.quantity,
                          }
                        : item
                );
            } else {
                // Aggiungi nuovo ordine
                orderItems = [...orderItems, { ...currentItem }];
            }
        }
        showModal = false;
        isEditing = false;
        editingIndex = -1;
    }

    async function submitOrder() {
        try {
            const finalOrder: Order = {
                ticketId: ticket?.ticketId || "",
                name: `${ticket?.name}`,
                surname: ticket?.surname || "",
                items: orderItems,
                done: false,
                creationDate: new Date(Date.now()),
            };
            const response = await fetch("/api/order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(finalOrder),
            });

            if (!response.ok) {
                throw new Error("Errore durante l'invio dell'ordine");
            }

            toast.success((await response.json()).message);
            // clear order on success
            orderItems = [];
            // reset all state
            reset();
        } catch (error) {
            console.error("Error submitting order:", error);
            toast.error("Errore durante l'invio dell'ordine");
        }
    }

    function adjustQuantity(increment: boolean) {
        if (increment) {
            currentItem.quantity++;
        } else if (currentItem.quantity > 1) {
            currentItem.quantity--;
        }
    }
</script>

<svelte:head>
    <title>Cassa</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5"
    >
        <h1 class="text-4xl font-bold text-primary-600">Cassa</h1>
        <p class="text-justify dark:text-white">
            Scansionare il QR e prendere l'ordine del cliente per inviarlo in
            cucina.
        </p>
        <div class="w-full">
            {#if !ticket}
                <Label class="text-md font-medium text-black dark:text-white">
                    Codice Biglietto <span class="text-primary-700">*</span>
                    <Input
                        required
                        class="mt-1 dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
                        bind:value={ticketCodeInput}
                        name="code"
                        autocomplete="off"
                        onkeypress={onKeyDown}
                    >
                        {#snippet left()}
                            <TicketIcon
                                class="h-6 w-6 text-primary-600 dark:text-white"
                            />
                        {/snippet}

                        {#snippet right()}}
                            <div class="flex h-full items-center gap-2">
                                {#if ticketCodeInput !== ""}
                                    <button
                                        onclick={() =>
                                            getTicket(ticketCodeInput)}
                                    >
                                        <Check color="green" />
                                    </button>
                                    <button onclick={reset}>
                                        <X color="indianred" />
                                    </button>
                                {/if}
                            </div>
                        {/snippet}
                    </Input>
                </Label>
                <div class="my-6 flex w-full items-center justify-center">
                    <QrReader bind:codeResult={ticketCode} />
                </div>
            {:else}
                <div class="flex flex-col gap-5">
                    <Card
                        class="w-full flex flex-col text-lg p-3 dark:bg-neutral-700 dark:border-neutral-500"
                        id="ticketInfos"
                    >
                        <span
                            class="text-black dark:text-white w-full flex justify-between"
                        >
                            <span>N° biglietto:</span>
                            <span class="font-mono">
                                <b>{ticket.ticketId}</b>
                            </span>
                        </span>
                        <span
                            class="text-black dark:text-white w-full flex justify-between"
                        >
                            <span>Nominativo:</span>
                            <span class="text-right"
                                >{(ticket?.name || "") +
                                    " " +
                                    (ticket?.surname || "")}</span
                            >
                        </span>
                        <div class="flex justify-between mt-3">
                            <button
                                class="text-sm text-primary-400 hover:text-primary-500"
                                onclick={reset}
                            >
                                Modifica codice
                            </button>
                            {#if orderItems.length > 0}
                                <Button
                                    class="text-sm flex items-center gap-2"
                                    onclick={submitOrder}
                                >
                                    <Send class="w-4 h-4" />
                                    Invia ordine
                                </Button>
                            {/if}
                        </div>
                    </Card>
                    <div class="flex gap-3 justify-around flex-wrap">
                        {#each Object.values(ItemType) as type}
                            <button
                                onclick={() => openOrderModal(type)}
                                class="flex-grow"
                            >
                                <Card
                                    class="w-full dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-200 p-5"
                                    >{type}</Card
                                >
                            </button>
                        {/each}
                    </div>
                    {#if orderItems.length > 0}
                        <div class="mt-4 flex flex-col gap-3">
                            <h3 class="text-lg font-semibold dark:text-white">
                                Ordine corrente:
                            </h3>
                            {#each [...orderItems].reverse() as item, i}
                                <Card
                                    class="relative dark:bg-neutral-700 dark:border-neutral-500 p-5"
                                >
                                    <div
                                        class="absolute right-2 top-2 flex gap-2"
                                    >
                                        <button
                                            class="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                            onclick={() => editOrder(i)}
                                        >
                                            <PencilLine
                                                class="w-5 h-5 text-blue-500"
                                            />
                                        </button>
                                        <button
                                            class="p-1 hover:bg-red-100 rounded-full transition-colors"
                                            onclick={() => removeFromOrder(i)}
                                        >
                                            <Trash2
                                                class="w-5 h-5 text-red-500"
                                            />
                                        </button>
                                    </div>
                                    <div class="pr-20">
                                        <!-- Increased right padding to accommodate both buttons -->
                                        <div
                                            class="flex items-baseline gap-2 mb-1"
                                        >
                                            <span class="font-medium text-lg"
                                                >{item.type}</span
                                            >
                                            <span class="text-primary-400"
                                                >x{item.quantity}</span
                                            >
                                            {#if item.glutenFree}
                                                <span
                                                    class="text-sm text-orange-300 font-bold"
                                                    >No glutine</span
                                                >
                                            {/if}
                                        </div>
                                        {#if item.removedIngredients?.length}
                                            <div
                                                class="text-sm text-red-500 dark:text-red-400"
                                            >
                                                Senza: {item.removedIngredients.join(
                                                    ", "
                                                )}
                                            </div>
                                        {/if}
                                    </div>
                                </Card>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</section>

<OrderModal
    bind:showModal
    bind:currentItem
    bind:isEditing
    hasSauce={false}
    {addToOrder}
    {adjustQuantity}
/>
