<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { PencilLine, Send, Trash2 } from "@lucide/svelte";

    import OrderModal from "$components/food/cashier/OrderModal.svelte";
    import type { User } from "$lib/auth/user";
    import { type Order, type OrderItem, ItemType } from "$models/order";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    $effect(() => {
        if (!$user) $user = data;
    });

    let order: Order = $state({
        ticketId: "",
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
            toast.error(validation.message);
            return;
        }

        try {
            const finalOrder: Order = {
                ticketId: "",
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
                body: JSON.stringify(
                    {
                        order: finalOrder,
                        shouldSendEmail: true
                    }
                ),
            });

            const orderResp = await response.json();

            toast.success(orderResp.message);
            orderItems = [];
            order = {
                ticketId: "",
                name: "",
                surname: "",
                email: "",
                items: [],
                creationDate: new Date(),
                done: null,
            };
            disableSend = false;
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
    <title>Ordini Staff</title>
</svelte:head>

<section class="flex h-full w-full grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 grow flex-col items-start gap-5 px-5 pb-12 pt-5"
    >
        <h1 class="text-4xl font-bold text-app-accent mb-2">Ordini Staff</h1>
        <p class="text-justify">
            Inserisci i dettagli del collegiale e dell'ordine.<br />
            <span class="font-bold">CONTROLLARE BENE L'EMAIL</span>
        </p>
        <div class="w-full space-y-4">
            <div class="flex gap-4">
                <div class="flex-1">
                    <Label for="name"
                        >Nome <span class="text-app-accent">*</span></Label
                    >
                    <Input
                        id="name"
                        name="name"
                        bind:value={order.name}
                        required
                        class="mt-1"
                    />
                </div>
                <div class="flex-1">
                    <Label for="surname"
                        >Cognome <span class="text-app-accent">*</span></Label
                    >
                    <Input
                        id="surname"
                        name="surname"
                        bind:value={order.surname}
                        required
                        class="mt-1"
                    />
                </div>
            </div>
            <div>
                <Label for="email"
                    >Email <span class="text-app-accent">*</span></Label
                >
                <Input
                    id="email"
                    name="email"
                    bind:value={order.email}
                    required
                    class="mt-1"
                />
            </div>

            <div class="flex gap-3 justify-around flex-wrap mt-3">
                {#each Object.values(ItemType) as type}
                    <button onclick={() => openOrderModal(type)} class="grow">
                        <Card.Root class="hover:bg-accent transition-colors">
                            <Card.Content class="px-4 text-center">
                                {type}
                            </Card.Content>
                        </Card.Root>
                    </button>
                {/each}
            </div>
            <Button
                class="flex items-center gap-2 w-full"
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
                    <h3 class="text-lg font-semibold">Prodotto selezionato:</h3>
                    {#each [...orderItems].reverse() as item, i}
                        <Card.Root class="relative">
                            <Card.Content class="py-0 px-4">
                                <div class="absolute right-4 top-8 flex gap-3">
                                    <button
                                        class="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                        onclick={() => editOrder(i)}
                                    >
                                        <PencilLine
                                            class="w-5 h-5 text-blue-400 hover:text-blue-500"
                                        />
                                    </button>
                                    <button
                                        class="p-1 hover:bg-red-100 rounded-full transition-colors"
                                        onclick={() => removeFromOrder(i)}
                                    >
                                        <Trash2
                                            class="w-5 h-5 text-red-400 hover:text-red-500"
                                        />
                                    </button>
                                </div>
                                <div class="pr-20">
                                    <div class="flex items-baseline gap-2 mb-1">
                                        <span class="font-medium text-lg"
                                            >{item.type}</span
                                        >
                                        <span class="text-app-accent"
                                            >x{item.quantity}</span
                                        >
                                        {#if item.glutenFree}
                                            <span
                                                class="text-sm text-orange-300 font-bold"
                                                >SENZA GLUTINE</span
                                            >
                                        {/if}
                                    </div>
                                    {#if item.removedIngredients?.length}
                                        <div class="text-sm text-red-400">
                                            <b>Senza:</b>
                                            {item.removedIngredients.join(", ")}
                                        </div>
                                    {/if}
                                </div>
                            </Card.Content>
                        </Card.Root>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</section>

<OrderModal
    bind:showModal
    bind:currentItem
    bind:isEditing
    hasQty={false}
    {addToOrder}
    {adjustQuantity}
/>
