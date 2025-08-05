<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import {
        Check,
        PencilLine,
        Send,
        Ticket as TicketIcon,
        Trash2,
        X,
    } from "@lucide/svelte";

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
        <p class="text-justify">
            Scansionare il QR e prendere l'ordine del cliente per inviarlo in
            cucina.
        </p>
        <div class="w-full">
            {#if !ticket}
                <Label class="text-md font-medium" for="ticketCodeInput">
                    Codice Biglietto <span class="text-chart-2">*</span>
                </Label>
                <div class="flex gap-3 items-center">
                    <Input
                        required
                        class="mt-1"
                        bind:value={ticketCodeInput}
                        name="code"
                        id="ticketCodeInput"
                        autocomplete="off"
                        onkeypress={onKeyDown}
                        placeholder={"FDP" +
                            new Date().getFullYear().toString().slice(-2) +
                            "-XXXX"}
                    />
                    {#if ticketCodeInput !== ""}
                        <div class="flex h-full items-center gap-2">
                            <button onclick={() => getTicket(ticketCodeInput)}>
                                <Check color="green" />
                            </button>
                            <button onclick={reset}>
                                <X color="indianred" />
                            </button>
                        </div>
                    {/if}
                </div>
                <div class="my-6 flex w-full items-center justify-center">
                    <QrReader bind:codeResult={ticketCode} />
                </div>
            {:else}
                <div class="flex flex-col gap-5">
                    <Card.Root id="ticketInfos">
                        <Card.Content class="px-6 py-2">
                            <span class="w-full flex justify-between">
                                <span>N° biglietto:</span>
                                <span class="font-mono">
                                    <b>{ticket.ticketId}</b>
                                </span>
                            </span>
                            <span class="w-full flex justify-between">
                                <span>Nominativo:</span>
                                <span class="text-right"
                                    >{(ticket?.name || "") +
                                        " " +
                                        (ticket?.surname || "")}</span
                                >
                            </span>
                            <div class="flex justify-between mt-3">
                                <button
                                    class="text-sm text-chart-2 hover:text-chart-2/80"
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
                        </Card.Content>
                    </Card.Root>
                    <div class="flex gap-3 justify-around flex-wrap">
                        {#each Object.values(ItemType) as type}
                            <button
                                onclick={() => openOrderModal(type)}
                                class="flex-grow"
                            >
                                <Card.Root
                                    class="hover:bg-accent transition-colors"
                                >
                                    <Card.Content class="px-4 text-center">
                                        {type}
                                    </Card.Content>
                                </Card.Root>
                            </button>
                        {/each}
                    </div>
                    {#if orderItems.length > 0}
                        <div class="mt-4 flex flex-col gap-3">
                            <h3 class="text-lg font-semibold">
                                Ordine corrente:
                            </h3>
                            {#each [...orderItems].reverse() as item, i}
                                <Card.Root class="relative">
                                    <Card.Content class="py-0 px-4">
                                        <div
                                            class="absolute right-4 top-8 flex gap-3"
                                        >
                                            <button
                                                onclick={() => editOrder(i)}
                                            >
                                                <PencilLine
                                                    class="w-5 h-5 text-blue-400 hover:text-blue-500"
                                                />
                                            </button>
                                            <button
                                                onclick={() =>
                                                    removeFromOrder(i)}
                                            >
                                                <Trash2
                                                    class="w-5 h-5 text-red-400 hover:text-red-500"
                                                />
                                            </button>
                                        </div>
                                        <div class="pr-20">
                                            <div class="flex flex-col gap-1 mb-2">
                                                <div
                                                    class="flex items-baseline gap-2"
                                                >
                                                    <span
                                                        class="font-medium text-lg"
                                                    >
                                                        {item.type}
                                                    </span>
                                                    <span class="text-chart-2">
                                                        x{item.quantity}
                                                    </span>
                                                </div>
                                                {#if item.glutenFree}
                                                    <span
                                                        class="text-sm text-orange-300 font-bold"
                                                    >
                                                        SENZA GLUTINE
                                                    </span>
                                                {/if}
                                            </div>
                                            {#if item.removedIngredients?.length}
                                                <div
                                                    class="text-sm text-red-400"
                                                >
                                                    <b>Senza:</b>
                                                    {item.removedIngredients.join(
                                                        ", "
                                                    )}
                                                </div>
                                            {/if}
                                        </div>
                                    </Card.Content>
                                </Card.Root>
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
