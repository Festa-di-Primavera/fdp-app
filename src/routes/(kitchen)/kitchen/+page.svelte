<script lang="ts">
    import type { User } from "$lib/auth/user";
    import { getClientDB } from "$lib/firebase/client";
    import type { Order } from "$models/order";
    import { user } from "$store/store";
    import {
        collection,
        limit,
        onSnapshot,
        orderBy,
        query,
        type Unsubscribe
    } from "firebase/firestore";
    import { Button, Card } from "flowbite-svelte";
    import { onDestroy, onMount } from "svelte";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    if (!$user) $user = data;

    let unsubscribe: Unsubscribe = () => {};
    
    let toDoOrders: Order[] = $state([]);
    let inProgressOrders: Order[] = $state([]);
    let doneOrders: Order[] = $state([]);

    // get orders from firestore
    function getOrders() {
        const q = query(
            collection(getClientDB(), "orders"),
            orderBy("creationDate", "asc"),
            limit(30)
        );
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            toDoOrders = [];
            inProgressOrders = [];
            doneOrders = [];

            querySnapshot.docs.forEach((orderDoc) => {
                const order = {
                    firebaseId: orderDoc.id,
                    ...orderDoc.data(),
                } as Order;

                if (order.done) {
                    doneOrders = [...doneOrders, order];
                } else if (order.done === false) {
                    inProgressOrders = [...inProgressOrders, order];
                } else {
                    toDoOrders = [...toDoOrders, order];
                }
            });
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
        "rgb(255, 105, 180)", // pink
        "rgb(30, 144, 255)",  // dodger blue
        "rgb(50, 205, 50)",   // lime green
        "rgb(255, 140, 0)",   // dark orange
        "rgb(255, 215, 0)",   // gold
        "rgb(0, 206, 209)",   // dark turquoise
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
        const orderKey = `${order.creationDate}_${order.ticketId}`;

        if (!orderColorMap.has(orderKey)) {
            orderColorMap.set(orderKey, getNextAvailableColorIndex());
        }

        return cardColors[orderColorMap.get(orderKey)!];
    }

    async function toggleItemReady(
        order: Order,
        itemIndex: number
    ) {        
        // Toggle the ready status in the local state
        order.items[itemIndex].ready = !order.items[itemIndex].ready;
        
        // Update the ready status in the database
        await fetch("/api/order", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                orderId: order.firebaseId,
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
                closeDate: new Date(),
                done: true,
            }),
        });
    }
</script>

<svelte:head>
    <title>Cucina</title>
</svelte:head>

<div class="p-4 w-full">
    <div class="flex flex-col sm:flex-row sm:gap-7 sm:items-center">
        <h1 class="text-4xl font-bold text-primary-600 mb-4 sm:mb-6 sm:mr-10">Cucina</h1>
        <div class="grid grid-cols-3 gap-2 sm:flex sm:gap-7 mb-6">
            <div class="flex flex-col items-center">
                <span class="text-md text-primary-600 dark:text-primary-400">Preparati</span>
                <span class="text-2xl font-semibold text-primary-600 dark:text-primary-400">{doneOrders.length}</span>
            </div>
            <div class="flex flex-col items-center">
                <span class="text-md text-orange-400 dark:text-orange-300">In attesa</span>
                <span class="text-2xl font-semibold text-orange-400 dark:text-orange-300">{inProgressOrders.length}</span>
            </div>
            <div class="flex flex-col items-center">
                <span class="text-md text-red-500 dark:text-red-400">Mancanti</span>
                <span class="text-2xl font-semibold text-red-500 dark:text-red-400">{toDoOrders.length}</span>
            </div>
        </div>
    </div>

    <div class="flex flex-wrap justify-around gap-y-10 gap-x-4 after:flex-auto">
        {#each inProgressOrders as order}
            <Card
                class="w-[22rem] h-max border-t-4 relative"
                style="border-top-color: {getOrderColor(order)}"
            >
                <div class="flex justify-between items-center mb-4">
                    <h2
                        class="text-md font-semibold"
                        style="color: {getOrderColor(order)}"
                    >
                        {order.name} {order.surname[0]}.
                    </h2>
                    <span class="text-lg text-gray-700 dark:text-gray-200">
                        <span class="font-mono">
                            <b>{order.ticketId}</b>
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
                                        toggleItemReady(order, itemIndex)}
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
                        <Button size="sm" onclick={() => closeOrder(order.firebaseId)}>
                            Chiudi Ordine
                        </Button>
                    </div>
                {/if}
            </Card>
        {/each}
        <!-- Spaziatura per mantenere la griglia ordinata -->
        {#each Array(10).fill(null) as _}
            <div class="w-[22rem] h-0"></div>
        {/each}
    </div>
</div>
