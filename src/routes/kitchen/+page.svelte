<script lang="ts">
    import type { User } from "$lib/auth/user";
    import { getClientDB } from "$lib/firebase/client";
    import type { Order } from "$models/order";
    import { user } from "$store/store";
    import {
        collection,
        onSnapshot,
        query,
        where,
        orderBy,
        type Unsubscribe,
    } from "firebase/firestore";
    import { Card } from "flowbite-svelte";
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
                return orderDoc.data();
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
    <title>Cucina</title>
</svelte:head>

<div class="p-4 w-full">
    <h1 class="text-4xl font-bold text-primary-600 mb-6">
        Cucina
    </h1>

    <div class="flex flex-wrap justify-around gap-4 after:flex-auto">
        {#each orders as order}
            <Card class="w-[22rem] h-max " color="dark">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-md font-semibold text-primary-600 dark:text-white">
                        {order.name}
                    </h2>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                        #{order.ticketId}
                    </span>
                </div>

                <div class="space-y-3">
                    {#each order.items as item}
                        <div class="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0">
                            <div class="flex items-baseline gap-2">
                                <span class="font-medium dark:text-white">{item.type}</span>
                                <span class="text-md font-semibold font-mono dark:text-primary-200">x{item.quantity}</span>
                                {#if item.glutenFree}
                                    <span class="text-sm text-orange-300 font-bold">(SENZA GLUTINE)</span>
                                {/if}
                            </div>

                            {#if item.removedIngredients?.length}
                                <div class="text-sm text-red-500 mt-1">
                                    {#each item.removedIngredients as ingredient}
                                        <div>NO {ingredient}</div>
                                    {/each}
                                </div>
                            {/if}

                            {#if item.addedSauces?.length}
                                <div class="text-sm text-green-400 mt-1">
                                    {#each item.addedSauces as sauce}
                                        <div>CON {sauce}</div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </Card>
        {/each}
        {#each Array(10).fill(null) as _}
            <div class="w-[22rem] h-0"></div>
        {/each}
    </div>
</div>
