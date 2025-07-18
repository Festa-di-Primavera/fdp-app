<script lang="ts">
    import { Button, Card, Input, Label, Spinner } from "flowbite-svelte";
    import {
        CheckCircle2,
        PencilLine,
        Send,
        Trash2,
        XCircle,
    } from "lucide-svelte";

    import FeedbackToast from "$components/feedbacks/FeedbackToast.svelte";
    import OrderModal from "$components/food/cashier/OrderModal.svelte";
    import type { User } from "$lib/auth/user";
    import { type Order, type OrderItem, ItemType } from "$models/order";
    import { user } from "$store/store";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    if (!$user) $user = data;

    let open: boolean = $state(false);
    let errorMessage: string = $state("Codice biglietto errato");

    let timeOut: NodeJS.Timeout;

    let order: Order = $state({
        ticketId: "STAFF",
        name: "",
        surname: "",
        email: "",
        items: [],
        creationDate: new Date(),
        done: false,
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
            // Limita l'ordine a un solo elemento
            orderItems = [{ ...currentItem }];
        }
        showModal = false;
        isEditing = false;
        editingIndex = -1;
    }

    let orderSubmitError: boolean = $state(true);
    let orderFeedbackMessage: string = $state("");

    function validateOrder(): { isValid: boolean; message: string } {
        if (!order.name || order.name.trim() === "") {
            return { isValid: false, message: "Il nome è obbligatorio" };
        }

        if (!order.surname || order.surname.trim() === "") {
            return { isValid: false, message: "Il cognome è obbligatorio" };
        }

        if (!order.email || order.email.trim() === "") {
            return { isValid: false, message: "L'email è obbligatoria" };
        }

        if (orderItems.length === 0) {
            return { isValid: false, message: "Seleziona almeno un prodotto" };
        }

        return { isValid: true, message: "" };
    }

    let disableSend: boolean = $state(false);
    async function submitOrder() {
        disableSend = true;
        const validation = validateOrder();
        if (!validation.isValid) {
            orderFeedbackMessage = validation.message;
            orderSubmitError = true;
            open = true;
            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                open = false;
                clearTimeout(timeOut);
            }, 3500);
            return;
        }

        try {
            const finalOrder: Order = {
                ticketId: order?.ticketId || "",
                name: `${order.name}`,
                surname: order.surname || "",
                email: order.email,
                items: orderItems,
                done: null,
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

            const orderResp = await response.json();
            const orderId = orderResp.orderId;

            const emailResp = await fetch("/api/order/manual-orders", {
                method: "POST",
                body: JSON.stringify({
                    name: order.name.trim(),
                    surname: order.surname.trim(),
                    email: order.email?.trim(),
                    orderId: orderId,
                    order: finalOrder,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            orderFeedbackMessage = orderResp.message;
            orderSubmitError = false;
            // clear order on success
            orderItems = [];
            order = {
                ticketId: "STAFF",
                name: "",
                surname: "",
                email: "",
                items: [],
                creationDate: new Date(),
                done: null,
            };
        } catch (error) {
            console.error("Error submitting order:", error);
            orderFeedbackMessage = "Errore durante l'invio dell'ordine";
            orderSubmitError = true;
        }
        open = true;
        disableSend = false;
        clearTimeout(timeOut);
        timeOut = setTimeout(() => {
            open = false;
            orderFeedbackMessage = "";
            orderSubmitError = true;
            clearTimeout(timeOut);
        }, 3500);
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
    <title>Ordini Manuali</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 flex-grow flex-col items-start gap-5 px-5 pb-12 pt-5"
    >
        {#if $user}
            <h1 class="text-4xl font-bold text-primary-600 mb-2">
                Ordini Manuali
            </h1>
            <p class="text-justify dark:text-white">
                Inserisci i dettagli del collegiale e dell'ordine.<br />
                <span class="font-bold"
                    >CONTROLLARE BENE L'EMAIL<span> </span></span
                >
            </p>
            <div class="w-full space-y-4">
                <div class="flex gap-4">
                    <Label class="block">
                        Nome <span class="text-primary-700">*</span>
                        <Input
                            name="name"
                            bind:value={order.name}
                            required
                            class="mt-2 dark:bg-neutral-700 dark:border-neutral-500"
                        />
                    </Label>
                    <Label class="block">
                        Cognome <span class="text-primary-700">*</span>
                        <Input
                            name="surname"
                            bind:value={order.surname}
                            required
                            class="mt-2 dark:bg-neutral-700 dark:border-neutral-500"
                        />
                    </Label>
                </div>
                <Label class="block mb-3">
                    Email <span class="text-primary-700">*</span>
                    <Input
                        name="email"
                        bind:value={order.email}
                        required
                        class="mt-2 dark:bg-neutral-700 dark:border-neutral-500"
                    />
                </Label>

                <div class="flex gap-3 justify-around flex-wrap mt-3">
                    {#each Object.values(ItemType) as type}
                        <button
                            onclick={() => openOrderModal(type)}
                            class="flex-grow"
                        >
                            <Card
                                class="w-full dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors p-5"
                                >{type}</Card
                            >
                        </button>
                    {/each}
                </div>
                <Button
                    class="text-md flex items-center gap-2 w-full"
                    onclick={submitOrder}
                    disabled={!order.name ||
                        !order.surname ||
                        !order.email ||
                        orderItems.length === 0 ||
                        disableSend}
                >
                    <Send class="w-4 h-4" />
                    Invia ordine
                </Button>
                {#if orderItems.length > 0}
                    <div class="mt-5 flex flex-col gap-3">
                        <h3 class="text-lg font-semibold dark:text-white">
                            Prodotto selezionato:
                        </h3>
                        {#each [...orderItems].reverse() as item, i}
                            <Card
                                class="relative dark:bg-neutral-700 dark:border-neutral-500 p-5"
                            >
                                <div class="absolute right-2 top-2 flex gap-2">
                                    <button
                                        class="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors"
                                        onclick={() => editOrder(i)}
                                    >
                                        <PencilLine
                                            class="w-5 h-5 text-blue-500"
                                        />
                                    </button>
                                    <button
                                        class="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors"
                                        onclick={() => removeFromOrder(i)}
                                    >
                                        <Trash2 class="w-5 h-5 text-red-500" />
                                    </button>
                                </div>
                                <div class="pr-20">
                                    <!-- Increased right padding to accommodate both buttons -->
                                    <div class="flex items-baseline gap-2 mb-1">
                                        <span
                                            class="font-medium text-lg dark:text-white"
                                            >{item.type}</span
                                        >
                                        <span
                                            class="text-gray-600 dark:text-gray-300"
                                            >x{item.quantity}</span
                                        >
                                        {#if item.glutenFree}
                                            <span
                                                class="text-sm text-orange-300"
                                                >(Senza glutine)</span
                                            >
                                        {/if}
                                    </div>
                                    {#if item.removedIngredients?.length}
                                        <div class="text-sm text-red-500">
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

                <FeedbackToast
                    bind:open
                    color={orderSubmitError ? "red" : "green"}
                    ToastIcon={orderSubmitError ? XCircle : CheckCircle2}
                    message={orderFeedbackMessage || errorMessage}
                />
            </div>
        {:else}
            <div
                class="mt-10 flex w-full flex-grow flex-col items-center justify-center gap-5"
            >
                <Spinner class="max-w-12 self-center p-5" />
                <span class="text-2xl font-semibold text-primary-600"
                    >Attendere...</span
                >
            </div>
        {/if}
    </div>
</section>

<OrderModal
    bind:showModal
    bind:currentItem
    bind:isEditing
    hasQty={false}
    hasSauce={false}
    {addToOrder}
    {adjustQuantity}
/>
