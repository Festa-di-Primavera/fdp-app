<script lang="ts">
    import type { User } from "$lib/auth/user";
    import { getClientDB } from "$lib/firebase/client";
    import type { Order } from "$models/order";
    import { user } from "$store/store";
    import {
        collection,
        onSnapshot,
        orderBy,
        query,
        where,
        type Unsubscribe,
    } from "firebase/firestore";
    import { Button, Card } from "flowbite-svelte";
    import { onDestroy, onMount } from "svelte";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    if (!$user) $user = data;

    let unsubscribe: Unsubscribe = () => {};
    let orders: Order[] = $state([]);

    // get orders from firestore
    function getOrders() {
        const q = query(
            collection(getClientDB(), "orders"),
            where("done", "==", false),
            orderBy("timestamp", "asc") // ordina per timestamp in ordine crescente
        );
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            orders = querySnapshot.docs.map((orderDoc) => {
                return {
                    ...orderDoc.data(),
                    id: orderDoc.id,
                };
            }) as Order[];
        });
    }

    onMount(() => {
        getOrders();
    });

    onDestroy(() => {
        unsubscribe();
    });

    // Array di colori per le card
    const cardColors = [
        "rgb(239 68 68)", // red
        "rgb(34 197 94)", // green
        "rgb(59 130 246)", // blue
        "rgb(168 85 247)", // purple
        "rgb(234 179 8)", // yellow
        "rgb(249 115 22)", // orange
        "rgb(236 72 153)", // pink
        "rgb(20 184 166)", // teal
    ];

    // Set per tenere traccia dei colori usati (più efficiente della ricerca in array)
    const usedColors = new Set<number>();

    function getNextAvailableColorIndex(): number {
        // Se tutti i colori sono stati usati, resetta il set
        if (usedColors.size === cardColors.length) {
            usedColors.clear();
        }

        // Trova il primo colore non utilizzato
        for (let i = 0; i < cardColors.length; i++) {
            if (!usedColors.has(i)) {
                usedColors.add(i);
                return i;
            }
        }

        return 0; // fallback
    }

    // Mappa per memorizzare i colori assegnati a ciascun ordine
    const orderColorMap = new Map<string, number>();

    function getOrderColor(order: Order): string {
        const orderKey = `${order.timestamp}_${order.ticketId}`;

        if (!orderColorMap.has(orderKey)) {
            orderColorMap.set(orderKey, getNextAvailableColorIndex());
        }

        return cardColors[orderColorMap.get(orderKey)!];
    }

    async function toggleItemReady(
        orderId: string | undefined,
        itemIndex: number
    ) {
        const order = orders.find((o) => o.id === orderId);
        if (!order) return;

        // Toggle the ready status in the local state
        order.items[itemIndex].ready = !order.items[itemIndex].ready;
        orders = [...orders];

        // Update the ready status in the database
        await fetch("/api/order", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                orderId,
                items: order.items,
            }),
        });
    }

    async function closeOrder(orderId: string | undefined) {
        await fetch("/api/order", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                orderId,
                done: true,
            }),
        });
    }
</script>

<svelte:head>
    <title>Cucina</title>
</svelte:head>

<div class="p-4 w-full">
    <h1 class="text-4xl font-bold text-primary-600 mb-6">Cucina</h1>

    <div class="flex flex-wrap justify-around gap-y-10 gap-x-4 after:flex-auto">
        {#each orders as order}
            <Card
                class="w-[22rem] h-max border-t-4 relative"
                style="border-top-color: {getOrderColor(order)}"
            >
                <div class="flex justify-between items-center mb-4">
                    <h2
                        class="text-md font-semibold"
                        style="color: {getOrderColor(order)}"
                    >
                        {order.name}
                    </h2>
                    <span class="text-lg text-gray-700 dark:text-gray-200">
                        <span class="font-mono">
                            XNRF <b>{order.ticketId.slice(4, 9)}</b> /25
                        </span>
                    </span>
                </div>

                <div class="space-y-3">
                    {#each order.items as item, itemIndex}
                        <div
                            class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0"
                        >
                            <div
                                class="flex items-baseline gap-2 justify-between"
                            >
                                <div class="flex flex-col gap-2">
                                    <div class="flex items-baseline gap-2">
                                        <span
                                            class="font-medium dark:text-white text-gray-700"
                                            >{item.type}</span
                                        >
                                        <span
                                            class="text-xl font-semibold font-mono text-primary-200"
                                            >x{item.quantity}</span
                                        >
                                    </div>

                                    {#if item.sauce}
                                        <span
                                            class="text-md text-green-500 dark:text-green-300 font-bold"
                                            >{item.sauce}</span
                                        >
                                    {/if}
                                </div>
                                {#if item.glutenFree}
                                    <span
                                        class="text-md text-orange-500 dark:text-orange-300 font-bold"
                                        >NO GLUT.</span
                                    >
                                {/if}
                                <button
                                    class="px-2 py-1 text-sm rounded-md font-semibold border-2
                                    {item.ready
                                        ? 'border-primary-400 text-primary-400'
                                        : 'border-gray-500 text-gray-500'}"
                                    onclick={() =>
                                        toggleItemReady(order.id, itemIndex)}
                                >
                                    {item.ready ? "✓ Pronto" : "Pronto"}
                                </button>
                            </div>

                            {#if item.removedIngredients?.length}
                                <div class="text-sm text-red-500 mt-1">
                                    {#each item.removedIngredients as ingredient}
                                        <div>NO {ingredient}</div>
                                    {/each}
                                </div>
                            {/if}
                            
                            <!-- TODO: remove -->
                            {#if item.notes}
                                <div class="text-sm text-red-500 mt-1">
                                    {item.notes}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>

                {#if order.items.every((item) => item.ready === true)}
                    <div class="mt-2 flex justify-end">
                        <Button size="sm" onclick={() => closeOrder(order.id)}>
                            Chiudi Ordine
                        </Button>
                    </div>
                {/if}
            </Card>
        {/each}
        {#each Array(10).fill(null) as _}
            <div class="w-[22rem] h-0"></div>
        {/each}
    </div>
</div>
