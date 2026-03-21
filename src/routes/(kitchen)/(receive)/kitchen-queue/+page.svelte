<script lang="ts">
    import * as Card from "$lib/components/ui/card/index";
    import { ORDERS } from "$lib/firebase/collections";
    import type { Order } from "$models/order";
    import {
        limit,
        onSnapshot,
        orderBy,
        query,
        where,
        type Unsubscribe,
    } from "firebase/firestore";
    import { onDestroy, onMount } from "svelte";

    let unsubscribe: Unsubscribe = () => {};
    let orders: Order[] = $state([]);

    const TOP = 3;

    const top = $derived(orders.slice(0, TOP));
    const rest = $derived(orders.slice(TOP));

    // get orders from firestore
    function getOrders() {
        const q = query(
            ORDERS,
            where("done", "==", false),
            orderBy("creationDate", "asc"),
            limit(30),
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

<div class="py-4 px-16 w-full overflow-hidden h-full grow">
    <div class="flex gap-10">
        <!-- Colonna top 5 -->
        <div class="flex flex-col w-1/4">
            <h1
                class="text-3xl h-12 content-center font-bold text-app-accent mb-6"
            >
                IN PREPARAZIONE
            </h1>
            <div class="flex flex-col gap-10">
                {#each top as order, i (i)}
                    <Card.Root
                        class="w-full border-l-4 relative border-l-app-accent"
                    >
                        <Card.Content>
                            <!-- segnalino posizione -->
                            <div
                                class="bg-linear-135 from-app-accent/50 to-app-accent rounded-md z-10 text-white absolute flex items-center justify-center h-max top-4 left-4 text-2xl font-normal font-mono px-2 py-1 shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
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
                        </Card.Content>
                    </Card.Root>
                {/each}
            </div>
        </div>

        <!-- Divisore verticale -->
        <div
            class="w-1 h-[75vh] rounded-full bg-linear-to-b from-primary-500 to-primary-800"
        ></div>

        <!-- Resto -->
        <div class="flex flex-col w-3/4">
            <h1
                class="text-2xl h-12 content-center font-bold text-app-accent mb-6"
            >
                PROSSIMI
            </h1>
            <div
                class="flex flex-wrap justify-around gap-y-10 gap-x-4 after:flex-auto"
            >
                {#each rest as order, i (i)}
                    <Card.Root
                        class="w-60 h-max border-l-4 relative p-5 border-l-app-accent/60"
                    >
                        <Card.Content class="p-0">
                            <div class="py-2">
                                <div
                                    class="absolute flex gap-2 items-center top-4 left-4 text-neutral-900"
                                >
                                    <span
                                        class="bg-linear-135 from-app-accent/40 to-app-accent/80 z-10 rounded-sm text-white flex items-center justify-center text-lg font-normal font-mono px-2 py-1 shadow-[0_3px_6px_rgba(0,0,0,0.15)]"
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
                                    <h2 class="text-lg w-full text-center">
                                        {order.name}
                                        {order.surname[0]}.
                                    </h2>
                                </div>
                            </div>
                        </Card.Content>
                    </Card.Root>
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
