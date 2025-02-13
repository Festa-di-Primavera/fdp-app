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
            orderBy("timestamp", "asc"),
            limit(30)
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
</script>

<svelte:head>
    <title>Coda</title>
</svelte:head>

<div class="py-4 px-16 w-full overflow-hidden h-full">
    <div class="flex gap-10">
        <!-- Colonna top 5 -->
        <div class="flex flex-col w-1/4">
            <style>
                @keyframes dots {
                    0%,
                    20% {
                        content: "";
                    }
                    40% {
                        content: " .";
                    }
                    60% {
                        content: " . .";
                    }
                    80%,
                    100% {
                        content: " . . .";
                    }
                }

                .animated-dots::after {
                    content: "";
                    animation: dots 2.5s infinite;
                }
            </style>

            <h1 class="text-3xl h-12 content-center font-bold text-primary-400 mb-6">
                IN PREPARAZIONE<span class="animated-dots text-4xl"></span>
            </h1>
            <div class="flex flex-col gap-4">
                {#each top as order, i (i)}
                    <Card
                        class="w-full border-t-4 relative"
                        style="border-top-color: #CD42D3"
                    >
                        <!-- segnalino posizione -->
                        <div
                            class="absolute aspect-square h-max top-4 left-4 rounded-lg bg-primary-400 text-white text-2xl font-semibold font-mono px-2 py-1"
                        >
                            #{i + 1}
                        </div>
                        <div
                            class="flex flex-col gap-2 justify-between items-center text-gray-800 dark:text-gray-300"
                        >
                            <h2 class="text-xl">
                                <!-- {order.name.split(' ')[0]} -->
                                {order.name}
                            </h2>
                            <span class="text-2xl">
                                <span class="font-mono">
                                    XNRF <b>{order.ticketId.slice(4, 9)}</b> /25
                                </span>
                            </span>
                        </div>
                    </Card>
                {/each}
            </div>
        </div>

		<!-- Divisore verticale -->
		<div class="w-1 h-[75vh] bg-primary-400 opacity-20 rounded-full"></div>

        <!-- Resto -->
        <div class="flex flex-col w-3/4">
            <h1 class="text-2xl h-12 content-center font-bold text-primary-400 mb-6">
                PROSSIMI
            </h1>
            <div
                class="flex flex-wrap justify-around gap-y-10 gap-x-4 after:flex-auto"
            >
                {#each rest as order, i (i)}
                    <Card
                        class="w-60 h-max border-t-4 relative"
                        style="border-top-color: #CD42D388;"
                    >
                        <!-- segnalino posizione -->
                        <div
                            class="absolute aspect-square h-max top-4 left-4 rounded-lg bg-primary-400 bg-opacity-50 text-white text-lg font-semibold font-mono px-2 py-1"
                        >
                            {i + 1 + TOP}
                        </div>
                        <div
                            class="flex flex-col gap-2 justify-between items-center text-gray-800 dark:text-gray-300"
                        >
                            <h2 class="text-lg">
                                <!-- {order.name.split(' ')[0]} -->
                                {order.name}
                            </h2>
                            <span class="text-lg">
                                <span class="font-mono"
                                    >{order.ticketId.split(" ")[0]}
                                    <b>{order.ticketId.split(" ")[1]}</b>
                                    {order.ticketId
                                        .split(" ")
                                        .slice(2)
                                        .join(" ")}</span
                                >
                            </span>
                        </div>
                    </Card>
                {/each}
                {#each Array(10).fill(null) as _}
                    <div class="w-60 h-0"></div>
                {/each}
            </div>
        </div>
    </div>
</div>
