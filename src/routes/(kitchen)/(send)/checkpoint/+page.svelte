<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import { Checkbox } from "$lib/components/ui/checkbox/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { Check, CircleCheck, PencilLine, Send, X } from "@lucide/svelte";

    import QrReader from "$components/QrReader.svelte";
    import type { User } from "$lib/auth/user";
    import { getFdPOrStaffCode } from "$lib/utils/tickets";
    import {
        DEFAULT_INGREDIENTS,
        ItemType,
        type Order,
        type OrderItem,
    } from "$models/order";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    $effect(() => {
        if (!$user) $user = data;
    });

    let ticketCode: string = $state("");
    let ticketCodeInput: string = $state("");

    let orders: Order[] = $state([]);
    let selectedOrders: Set<string> = $state(new Set());

    let showModal = $state(false);
    let currentItem: OrderItem = $state({
        type: ItemType.ONTO,
        quantity: 1,
        removedIngredients: [],
    });

    let editingOrderId = $state("");
    let editingIndex = $state(-1);

    async function getOrder(code: string) {
        const res = await fetch(
            `/api/order/${encodeURIComponent(getFdPOrStaffCode(code)!!)}`
        );
        ticketCodeInput = "";

        const responseBody = await res.json();
        if (res.status == 404 || res.status == 403 || res.status == 401) {
            toast.error(responseBody.message);
            return;
        }

        orders = responseBody.orders as Order[];
        selectedOrders = new Set();
    }

    function toggleOrderSelection(orderId: string) {
        if (selectedOrders.has(orderId)) {
            selectedOrders.delete(orderId);
        } else {
            selectedOrders.add(orderId);
        }
        selectedOrders = new Set(selectedOrders);
    }

    function editOrder(orderId: string, itemIndex: number) {
        const order = orders.find((o) => o.firebaseId === orderId);
        if (!order) return;

        currentItem = { ...order.items[itemIndex] };
        editingOrderId = orderId;
        editingIndex = itemIndex;
        showModal = true;
    }

    function saveItemChanges() {
        orders = orders.map((order) => {
            if (order.firebaseId === editingOrderId) {
                return {
                    ...order,
                    items: order.items.map((item, index) =>
                        index === editingIndex ? { ...currentItem } : item
                    ),
                };
            }
            return order;
        });
        showModal = false;
        editingOrderId = "";
        editingIndex = -1;
    }

    const reset = () => {
        orders = [];
        selectedOrders = new Set();
        ticketCodeInput = "";
        ticketCode = "";
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && ticketCodeInput !== "") {
            getOrder(ticketCodeInput);
        }
    };

    $effect(() => {
        if (ticketCode !== "") {
            getOrder(ticketCode);
        } else {
            reset();
        }
    });

    async function submitOrder() {
        if (selectedOrders.size === 0) {
            toast.error("Seleziona almeno un ordine da inviare");
            return;
        }

        try {
            const ordersToSubmit = orders.filter((order) =>
                selectedOrders.has(order.firebaseId!)
            );

            // Submit each selected order
            const promises = ordersToSubmit.map((order) =>
                fetch("/api/order", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        orderId: order.firebaseId,
                        done: false,
                        creationDate: new Date(Date.now()),
                        items: order.items,
                    }),
                })
            );

            const responses = await Promise.all(promises);

            const allSuccessful = responses.every((r) => r.ok);
            if (!allSuccessful) {
                throw new Error("Alcuni ordini non sono stati inviati");
            }

            toast.success(
                `${ordersToSubmit.length} ordine/i inviato/i in cucina`
            );
            reset();
        } catch (error) {
            console.error("Error submitting orders:", error);
            toast.error("Errore durante l'invio degli ordini");
        }
    }
</script>

<svelte:head>
    <title>Check Point</title>
</svelte:head>

<section class="flex h-full w-full grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 grow flex-col items-start gap-4 px-5 pb-12 pt-5"
    >
        <h1 class="text-4xl font-bold text-app-accent">Check Point</h1>
        <p class="text-justify">
            Scansionare il QR. L'ordine arriverà direttamente in cucina.
        </p>
        <div class="w-full">
            {#if orders.length === 0}
                <Label class="text-md font-medium" for="ticketCodeInput">
                    Codice Biglietto <span class="text-app-accent">*</span>
                </Label>
                <div class="flex gap-3 items-center">
                    <Input
                        required
                        class="mt-1"
                        bind:value={ticketCodeInput}
                        name="code"
                        id="ticketCodeInput"
                        autocomplete="off"
                        placeholder={"FDP" +
                            new Date().getFullYear().toString().slice(-2) +
                            "-XXXX o STAFF" +
                            new Date().getFullYear().toString().slice(-2) +
                            "-XXXX"}
                        onkeypress={onKeyDown}
                    />
                    {#if ticketCodeInput !== ""}
                        <div class="flex h-full items-center gap-2">
                            <button onclick={() => getOrder(ticketCodeInput)}>
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
                <div class="flex flex-col gap-4">
                    <Card.Root>
                        <Card.Content class="px-6 py-3">
                            <div class="mb-2">
                                <div class="font-semibold text-lg">
                                    {orders[0].name}
                                    {orders[0].surname}
                                </div>
                                <div class="text-sm text-muted-foreground">
                                    {orders[0].ticketId}
                                </div>
                            </div>
                            <div class="mb-2">
                                <span class="font-semibold">
                                    {orders.length}
                                    {orders.length === 1
                                        ? "ordine trovato"
                                        : "ordini trovati"}
                                </span>
                            </div>
                            <div class="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onclick={reset}
                                >
                                    <X class="w-4 h-4 mr-1" />
                                    Annulla
                                </Button>
                                <Button
                                    size="sm"
                                    onclick={submitOrder}
                                    disabled={selectedOrders.size === 0}
                                >
                                    <Send class="w-4 h-4 mr-1" />
                                    Invia ({selectedOrders.size})
                                </Button>
                            </div>
                        </Card.Content>
                    </Card.Root>

                    {#each orders as order (order.firebaseId)}
                        <Card.Root
                            class="transition-all cursor-pointer {selectedOrders.has(
                                order.firebaseId!
                            )
                                ? 'border-app-accent border-2'
                                : ''}"
                            onclick={() =>
                                toggleOrderSelection(order.firebaseId!)}
                        >
                            <Card.Content>
                                <div class="flex items-start gap-3">
                                    <div class="flex-1">
                                        {#if order.items.length > 0}
                                            <div class="flex flex-col gap-2">
                                                {#each order.items as item, itemIndex}
                                                    <div
                                                        class="relative bg-accent/70 rounded-md p-3"
                                                    >
                                                        <div
                                                            class="absolute right-2 top-2"
                                                        >
                                                            <button
                                                                class="p-1 hover:text-blue-500 rounded-full transition-colors"
                                                                onclick={(e) => {
                                                                    e.stopPropagation();
                                                                    editOrder(
                                                                        order.firebaseId!,
                                                                        itemIndex
                                                                    );
                                                                }}
                                                            >
                                                                <PencilLine
                                                                    class="w-4 h-4 text-blue-400 hover:text-blue-500"
                                                                />
                                                            </button>
                                                        </div>
                                                        <div class="pr-8">
                                                            <div
                                                                class="flex items-baseline gap-2 mb-1"
                                                            >
                                                                <span
                                                                    class="font-medium"
                                                                    >{item.type}</span
                                                                >
                                                                <span
                                                                    class="text-app-accent text-sm"
                                                                    >x{item.quantity}</span
                                                                >
                                                            </div>
                                                            {#if item.glutenFree}
                                                                <div
                                                                    class="text-sm text-orange-300 font-bold"
                                                                >
                                                                    SENZA
                                                                    GLUTINE
                                                                </div>
                                                            {/if}
                                                            {#if item.removedIngredients?.length}
                                                                <div
                                                                    class="text-sm text-red-400"
                                                                >
                                                                    <b>Senza:</b
                                                                    >
                                                                    {item.removedIngredients.join(
                                                                        ", "
                                                                    )}
                                                                </div>
                                                            {/if}
                                                            {#if item.notes}
                                                                <div
                                                                    class="text-sm text-red-400"
                                                                >
                                                                    <b>Note:</b>
                                                                    {item.notes}
                                                                </div>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </Card.Content>
                        </Card.Root>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</section>

<Dialog.Root bind:open={showModal}>
    <Dialog.Content class="max-w-md">
        <Dialog.Header>
            <Dialog.Title>Modifica Ordine</Dialog.Title>
        </Dialog.Header>
        <div class="mb-4 flex flex-col gap-4">
            <!-- Selezione tipo -->
            <div>
                <span class="font-semibold mb-2 block">Tipo:</span>
                <div class="flex gap-3 justify-around flex-wrap">
                    {#each Object.values(ItemType) as type}
                        <button
                            onclick={() => (currentItem.type = type)}
                            class="grow"
                        >
                            <Card.Root
                                class="hover:bg-accent transition-colors {currentItem.type ===
                                type
                                    ? 'border-primary'
                                    : ''}"
                            >
                                <Card.Content
                                    class="px-4 text-center flex items-center justify-center gap-2"
                                >
                                    {#if currentItem.type === type}
                                        <CircleCheck
                                            class="w-5 h-5 text-green-500"
                                        />
                                    {/if}
                                    {type}
                                </Card.Content>
                            </Card.Root>
                        </button>
                    {/each}
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <Checkbox
                    id="glutenFree"
                    bind:checked={currentItem.glutenFree}
                />
                <Label
                    for="glutenFree"
                    class="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-orange-300"
                >
                    Senza glutine
                </Label>
            </div>

            {#if DEFAULT_INGREDIENTS[currentItem.type]?.length > 0}
                <div>
                    <span class="font-semibold text-red-400 block mb-2"
                        >Rimuovi ingredienti:</span
                    >
                    {#each DEFAULT_INGREDIENTS[currentItem.type] as ingredient}
                        <div class="flex items-center space-x-2 p-1">
                            <Checkbox
                                id={ingredient}
                                checked={currentItem.removedIngredients?.includes(
                                    ingredient
                                )}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        currentItem.removedIngredients = [
                                            ...(currentItem.removedIngredients ||
                                                []),
                                            ingredient,
                                        ];
                                    } else {
                                        currentItem.removedIngredients =
                                            currentItem.removedIngredients?.filter(
                                                (i) => i !== ingredient
                                            ) || [];
                                    }
                                }}
                            />
                            <Label
                                for={ingredient}
                                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {currentItem.removedIngredients?.includes(
                                    ingredient
                                )
                                    ? 'line-through text-red-400'
                                    : ''}"
                            >
                                {ingredient}
                            </Label>
                        </div>
                    {/each}
                </div>
            {/if}

            <div>
                <span class="font-semibold text-red-400 block mb-2">Note:</span>
                <Input
                    type="text"
                    bind:value={currentItem.notes}
                    placeholder="Inserisci eventuali note..."
                />
            </div>
        </div>

        <Dialog.Footer class="flex justify-end gap-3">
            <Button variant="outline" onclick={() => (showModal = false)}
                >Annulla</Button
            >
            <Button onclick={saveItemChanges}>Salva modifiche</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
