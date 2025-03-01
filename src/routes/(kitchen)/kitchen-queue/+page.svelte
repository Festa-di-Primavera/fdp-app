<script lang="ts">
    import { getClientDB } from "$lib/firebase/client";
    import type { Order } from "$models/order";
    import {
        collection,
        limit,
        onSnapshot,
        orderBy,
        query,
        where,
        type Unsubscribe,
    } from "firebase/firestore";
    import { Card } from "flowbite-svelte";
    import { onDestroy, onMount } from "svelte";

    let unsubscribe: Unsubscribe = () => {};
    let orders: Order[] = $state([]);

    const TOP = 3;

    const top = $derived(orders.slice(0, TOP));
    const rest = $derived(orders.slice(TOP));

    // get orders from firestore
    function getOrders() {
        const q = query(
            collection(getClientDB(), "orders"),
            where("done", "==", false),
            orderBy("creationDate", "asc"),
            limit(30)
        );
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            orders = querySnapshot.docs.map((orderDoc) => {
                return {
                    ...orderDoc.data(),
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
</script>

<svelte:head>
    <title>Coda</title>
</svelte:head>

<div class="py-4 px-16 w-full overflow-hidden h-full flex-grow">
    <div class="flex gap-10">
        <!-- Colonna top 5 -->
        <div class="flex flex-col w-1/4">
            <h1
                class="text-3xl h-12 content-center font-bold text-primary-400 mb-6"
            >
                IN PREPARAZIONE
            </h1>
            <div class="flex flex-col gap-10">
                {#each top as order, i (i)}
                    <Card
                        class="w-full border-t-4 relative"
                        style="border-top-color: #007a22"
                    >
                        <!-- segnalino posizione -->
                        <div
                            class="absolute flex items-center justify-center h-max top-4 left-4 rounded-lg bg-primary-400 text-slate-800 text-2xl font-semibold font-mono px-2 py-1"
                        >
                            #{i + 1}
                        </div>
                        <div
                            class="flex flex-col gap-2 justify-between items-center text-gray-800 dark:text-gray-300"
                        >
                            <span class="text-2xl">
                                <span class="font-mono">
                                    <b>{order.ticketId}</b>
                                </span>
                            </span>
                            <h2 class="text-xl">
                                {order.name}
                                {order.surname[0]}.
                            </h2>
                        </div>
                    </Card>
                {/each}
            </div>
        </div>

        <!-- Divisore verticale -->
        <div class="w-1 h-[75vh] bg-primary-400 opacity-20 rounded-full"></div>

        <!-- Resto -->
        <div class="flex flex-col w-3/4">
            <h1
                class="text-2xl h-12 content-center font-bold text-primary-400 mb-6"
            >
                PROSSIMI
            </h1>
            <div
                class="flex flex-wrap justify-around gap-y-10 gap-x-4 after:flex-auto"
            >
                {#each rest as order, i (i)}
                    <Card
                        class="w-60 h-max border-t-4 relative"
                        style="border-top-color: #007a2288;"
                        padding="sm"
                    >
                        <div class="py-2">
                            <div
                                class="absolute flex gap-2 items-center top-4 left-4 text-slate-900"
                            >
                                <span
                                    class="flex items-center justify-center rounded-lg bg-primary-400 bg-opacity-50 text-lg font-semibold font-mono px-2 py-1"
                                >
                                    #{i + 1 + TOP}
                                </span>
                            </div>
                            <div
                                class="text-gray-800 dark:text-gray-300 flex flex-col gap-2 justify-between items-center"
                            >
                                <span class="text-xl font-mono">
                                    <b>{order.ticketId}</b>
                                </span>
                                <h2
                                    class="text-lg w-full text-center whitespace-nowrap overflow-hidden"
                                >
                                    {order.name}
                                    {order.surname[0]}.
                                </h2>
                            </div>
                        </div>
                    </Card>
                {/each}
                {#each Array(10) as _}
                    <div class="w-60 h-0"></div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    * {
        user-select: none;
        cursor: none;
    }
</style>
