<script lang="ts">
    import OrderCard from "$components/food/kitchen/OrderCard.svelte";
    import type { User } from "$lib/auth/user";
    import { ORDERS } from "$lib/firebase/collections";
    import { type Order } from "$models/order";
    import { user } from "$store/store";
    import {
        onSnapshot,
        orderBy,
        query,
        type Unsubscribe,
    } from "firebase/firestore";
    import { onDestroy, onMount } from "svelte";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    $effect(() => {
        if (!$user) $user = data;
    });

    let unsubscribe: Unsubscribe = () => {};

    let toDoOrders: Order[] = $state([]);
    let inProgressOrders: Order[] = $state([]);
    let doneOrders: Order[] = $state([]);

    function getOrders() {
        const q = query(ORDERS, orderBy("creationDate", "asc"));
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            querySnapshot.docChanges().forEach((change) => {
                const order = {
                    firebaseId: change.doc.id,
                    ...change.doc.data(),
                } as Order;

                if (change.type === "added") {
                    addOrderToCorrectArray(order);
                } else if (change.type === "modified") {
                    updateOrderInCorrectArray(order);
                } else if (change.type === "removed") {
                    removeOrderFromArrays(order.firebaseId);
                }
            });
        });
    }

    function addOrderToCorrectArray(order: Order) {
        if (order.done === true) {
            doneOrders = [...doneOrders, order]
        } else if (order.done === false) {
            inProgressOrders = [...inProgressOrders, order].sort((a, b) =>
                a.creationDate < b.creationDate ? -1 : 1
            );
        } else {
            toDoOrders = [...toDoOrders, order]
        }
    }

    function updateOrderInCorrectArray(order: Order) {
        removeOrderFromArrays(order.firebaseId);

        addOrderToCorrectArray(order);
    }

    function removeOrderFromArrays(orderId?: string) {
        doneOrders = doneOrders.filter((o) => o.firebaseId !== orderId);
        inProgressOrders = inProgressOrders.filter(
            (o) => o.firebaseId !== orderId
        );
        toDoOrders = toDoOrders.filter((o) => o.firebaseId !== orderId);
    }

    onMount(() => {
        getOrders();
    });

    onDestroy(() => {
        unsubscribe();
    });

    const cardColors = [
        "rgb(255, 105, 180)",
        "rgb(30, 144, 200)",
        "rgb(34, 139, 34)",
        "rgb(255, 127, 80)",
    ];

    // Set per tenere traccia dei colori usati (più efficiente della ricerca in array)
    const usedColors = new Set<number>();

    function getNextAvailableColorIndex(): number {
        if (usedColors.size === cardColors.length) {
            usedColors.clear();
        }

        for (let i = 0; i < cardColors.length; i++) {
            if (!usedColors.has(i)) {
                usedColors.add(i);
                return i;
            }
        }

        return 0;
    }

    const orderColorMap = new Map<string, number>();

    function getOrderColor(order: Order): string {
        const orderKey = `${order.creationDate}_${order.ticketId}`;

        if (!orderColorMap.has(orderKey)) {
            orderColorMap.set(orderKey, getNextAvailableColorIndex());
        }

        return cardColors[orderColorMap.get(orderKey)!];
    }
</script>

<svelte:head>
    <title>Cucina</title>
</svelte:head>

<div class="p-4 w-full">
    <div class="flex flex-col sm:flex-row sm:gap-7 sm:items-center">
        <h1 class="text-4xl font-bold text-app-accent mb-4 sm:mb-6 sm:mr-10">
            Cucina
        </h1>
        <div class="grid grid-cols-3 gap-2 sm:flex sm:gap-7 mb-6">
            <div class="flex flex-col items-center">
                <span
                    class="text-md font-medium text-app-accent"
                    >Preparati</span
                >
                <span
                    class="text-2xl font-semibold text-app-accent"
                    >{doneOrders.length}</span
                >
            </div>
            <div class="flex flex-col items-center">
                <span
                    class="text-md font-medium text-orange-600 dark:text-orange-300"
                    >In attesa</span
                >
                <span
                    class="text-2xl font-semibold text-orange-600 dark:text-orange-300"
                    >{inProgressOrders.length}</span
                >
            </div>
            <!-- ORDINI ANCORA DA SCANNERIZZARE/INVIARE TRAMITE IL LINK -->
            <div class="flex flex-col items-center">
                <span class="text-md text-red-500 dark:text-red-400"
                    >Mancanti <i>(STAFF)</i></span
                >
                <span
                    class="text-2xl font-semibold text-red-500 dark:text-red-400"
                    >{toDoOrders.length}</span
                >
            </div>
        </div>
    </div>

    <div class="flex flex-wrap justify-around gap-y-10 gap-x-4 after:flex-auto">
        {#each inProgressOrders as order}
            <OrderCard {order} color={getOrderColor(order)} />
        {/each}
        <!-- Spaziatura per mantenere la griglia ordinata -->
        {#each Array(10).fill(null) as _}
            <div class="w-[22rem] h-0"></div>
        {/each}
    </div>
</div>
