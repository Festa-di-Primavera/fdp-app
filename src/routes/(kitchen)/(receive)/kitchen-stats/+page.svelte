<script lang="ts">
    import * as Card from "$lib/components/ui/card/index";
    import { ORDERS } from "$lib/firebase/collections";
    import { type Order, ItemType } from "$models/order";
    import {
        Beef,
        Hamburger,
        Leaf,
        PawPrint,
        Sandwich,
        UtensilsCrossed,
        WheatOff,
    } from "@lucide/svelte";
    import {
        type Unsubscribe,
        onSnapshot,
        query,
        where,
    } from "firebase/firestore";
    import { onDestroy, onMount } from "svelte";

    let unsubscribe: Unsubscribe = () => {};
    let unsubscribeCompleted: Unsubscribe = () => {}; // New unsubscribe for completed orders

    let inProgressOrders: Order[] = $state([]);
    let completedOrders: Order[] = $state([]); // New state for completed orders

    // Stats data - calculated from order items
    const vegetarianCount = $derived(
        inProgressOrders.reduce((count, order) => {
            // Count vegetarian items in the order
            const vegetarianItems = order.items
                .filter((item) => item.type === ItemType.VEGETARIANO)
                .reduce((total, item) => total + item.quantity, 0);
            return count + vegetarianItems;
        }, 0),
    );

    const ontiCount = $derived(
        inProgressOrders.reduce((count, order) => {
            // Count onti items in the order
            const ontiItems = order.items
                .filter((item) => item.type === ItemType.ONTO)
                .reduce((total, item) => total + item.quantity, 0);
            return count + ontiItems;
        }, 0),
    );

    const basicCount = $derived(
        inProgressOrders.reduce((count, order) => {
            // Count basic items in the order
            const basicItems = order.items
                .filter((item) => item.type === ItemType.BASIC)
                .reduce((total, item) => total + item.quantity, 0);
            return count + basicItems;
        }, 0),
    );

    const glutenFreeCount = $derived(
        inProgressOrders.reduce((count, order) => {
            // Count gluten-free items in the order
            const glutenFreeItems = order.items
                .filter((item) => item.glutenFree === true)
                .reduce((total, item) => total + item.quantity, 0);
            return count + glutenFreeItems;
        }, 0),
    );

    const hotdogCount = $derived(
        inProgressOrders.reduce((count, order) => {
            // Count basic items in the order
            const hotdogItems = order.items
                .filter((item) => item.type === ItemType.HOTDOG)
                .reduce((total, item) => total + item.quantity, 0);
            return count + hotdogItems;
        }, 0),
    );

    // Stats for completed orders - total sandwiches and hamburgers
    const totalSandwichesConsumed = $derived(
        completedOrders.reduce((count, order) => {
            // Sum all order items regardless of type
            const sandwichesInOrder = order.items
                .filter(
                    (item) =>
                        item.type === ItemType.BASIC ||
                        item.type === ItemType.ONTO,
                )
                .reduce((total, item) => total + item.quantity, 0);
            return count + sandwichesInOrder;
        }, 0),
    );

    const totalHamburgersConsumed = $derived(
        completedOrders.reduce((count, order) => {
            // Sum only BASIC and ONTO items (which contain meat)
            const hamburgersInOrder = order.items
                .filter(
                    (item) =>
                        item.type === ItemType.BASIC ||
                        item.type === ItemType.ONTO,
                )
                .reduce((total, item) => total + item.quantity, 0);
            return count + hamburgersInOrder;
        }, 0),
    );

    const totalWurstelConsumed = $derived(
        completedOrders.reduce((count, order) => {
            return (
                count +
                order.items
                    .filter((item) => item.type === ItemType.HOTDOG)
                    .reduce((total, item) => total + item.quantity, 0)
            );
        }, 0),
    );

    // get orders from firestore - modified to fetch both in-progress and completed orders
    function getOrders() {
        // Query for in-progress orders
        const qInProgress = query(ORDERS, where("done", "==", false));

        // Query for completed orders
        const qCompleted = query(ORDERS, where("done", "==", true));

        // Subscribe to in-progress orders with optimized handling
        unsubscribe = onSnapshot(qInProgress, (querySnapshot) => {
            querySnapshot.docChanges().forEach((change) => {
                const order = {
                    firebaseId: change.doc.id,
                    ...change.doc.data(),
                } as Order;

                if (change.type === "added" || change.type === "modified") {
                    // If order is not done, add to inProgress array
                    if (!order.done) {
                        addOrderToArray(
                            order,
                            inProgressOrders,
                            completedOrders,
                        );
                    }
                } else if (change.type === "removed") {
                    removeOrderFromArray(order.firebaseId, inProgressOrders);
                }
            });
        });

        // Subscribe to completed orders with optimized handling
        unsubscribeCompleted = onSnapshot(qCompleted, (querySnapshot) => {
            querySnapshot.docChanges().forEach((change) => {
                const order = {
                    firebaseId: change.doc.id,
                    ...change.doc.data(),
                } as Order;

                if (change.type === "added" || change.type === "modified") {
                    // If order is done, add to completed array
                    if (order.done) {
                        addOrderToArray(
                            order,
                            completedOrders,
                            inProgressOrders,
                        );
                    }
                } else if (change.type === "removed") {
                    removeOrderFromArray(order.firebaseId, completedOrders);
                }
            });
        });
    }

    // Helper function to add an order to the correct array
    function addOrderToArray(
        order: Order,
        targetArray: Order[],
        otherArray: Order[],
    ) {
        // First remove from the other array if it exists there
        removeOrderFromArray(order.firebaseId, otherArray);

        // Then check if it already exists in target array
        const index = targetArray.findIndex(
            (o) => o.firebaseId === order.firebaseId,
        );

        if (index !== -1) {
            // Update existing order
            targetArray[index] = order;
        } else {
            // Add new order
            targetArray.push(order);
        }
    }

    // Helper function to remove an order from an array
    function removeOrderFromArray(orderId: string | undefined, array: Order[]) {
        const index = array.findIndex((o) => o.firebaseId === orderId);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }

    onMount(() => {
        getOrders();
    });

    onDestroy(() => {
        unsubscribe();
        unsubscribeCompleted(); // Unsubscribe from completed orders query
    });
</script>

<svelte:head>
    <title>Statistiche Cucina</title>
</svelte:head>

<div class="px-4 w-full flex flex-col">
    <!-- <p>SENZA GLUTINE: {glutenFreeCount}</p> -->

    <!-- <p class="my-5">=== FATTI ===</p>
    <p>VEGETARIANI: {0}</p>
    <p>ONTI: {0}</p>
    <p>BASIC: {0}</p>
    <p>SENZA GLUTINE: {0}</p>
    <p>HOT DOG: {0}</p> -->

    <!-- Card con statistiche di consumo -->
    <div class="grow flex flex-wrap gap-10 justify-evenly items-center mt-16">
        <Card.Root class="w-96 p-14">
            <Card.Content class="p-0">
                <div class="flex flex-col items-center justify-center gap-3">
                    <Beef class="w-10 h-10 text-red-500" />
                    <span
                        class="text-5xl font-bold text-red-600 dark:text-red-400"
                    >
                        {totalHamburgersConsumed}
                    </span>
                    <span
                        class="text-xl text-center font-medium dark:text-white"
                    >
                        Hamburger consumati
                    </span>
                </div>
            </Card.Content>
        </Card.Root>
        <Card.Root class="w-96 p-14">
            <Card.Content class="p-0">
                <div class="flex flex-col items-center justify-center gap-3">
                    <Hamburger class="w-10 h-10 text-app-accent" />
                    <span class="text-5xl font-bold text-app-accent/80">
                        {totalSandwichesConsumed}
                    </span>
                    <span
                        class="text-xl text-center font-medium dark:text-white"
                    >
                        Pane consumato
                    </span>
                </div>
            </Card.Content>
        </Card.Root>
        <Card.Root class="w-96 p-14">
            <Card.Content class="p-0">
                <div class="flex flex-col items-center justify-center gap-3">
                    <Beef class="w-10 h-10 text-red-500" />
                    <span
                        class="text-5xl font-bold text-red-600 dark:text-red-400"
                    >
                        {totalWurstelConsumed}
                    </span>
                    <span
                        class="text-xl text-center font-medium dark:text-white"
                    >
                        Wurstel consumati
                    </span>
                </div>
            </Card.Content>
        </Card.Root>
    </div>

    <hr class="my-15" />

    <!-- Statistical Cards - centered vertically -->
    <div class="grow flex flex-wrap gap-10 justify-evenly items-center">
        <!-- Non-vegetarian Card Group -->
        <Card.Root
            class="w-96 h-125 flex flex-col items-center justify-center py-8 p-16"
        >
            <Card.Content class="p-0 h-full flex items-center justify-center">
                <div class="flex flex-col items-center justify-center gap-6">
                    <UtensilsCrossed class="w-14 h-14 text-violet-500" />
                    <span
                        class="text-6xl font-bold text-violet-600 dark:text-violet-400"
                    >
                        {basicCount + ontiCount}
                    </span>
                    <span
                        class="text-3xl text-center font-medium dark:text-white"
                    >
                        Non-vegetariani in coda
                    </span>

                    <!-- Subcategories in separate cards -->
                    <div class="flex gap-6 mt-6 w-full">
                        <Card.Root class="flex-1 p-14">
                            <Card.Content class="p-0">
                                <div class="flex flex-col items-center gap-4">
                                    <span
                                        class="text-5xl font-bold text-orange-600 dark:text-orange-400"
                                    >
                                        {ontiCount}
                                    </span>
                                    <span
                                        class="text-2xl text-center font-medium text-orange-600 dark:text-orange-400"
                                    >
                                        Onti
                                    </span>
                                </div>
                            </Card.Content>
                        </Card.Root>

                        <Card.Root class="flex-1 p-14">
                            <Card.Content class="p-0">
                                <div class="flex flex-col items-center gap-4">
                                    <span
                                        class="text-5xl font-bold text-blue-600 dark:text-blue-400"
                                    >
                                        {basicCount}
                                    </span>
                                    <span
                                        class="text-2xl text-center font-medium text-blue-600 dark:text-blue-400"
                                    >
                                        Basic
                                    </span>
                                </div>
                            </Card.Content>
                        </Card.Root>
                    </div>
                </div>
            </Card.Content>
        </Card.Root>

        <!-- Vegetarian Card -->
        <Card.Root
            class="w-96 h-125 flex flex-col items-center justify-center py-8 p-16"
        >
            <Card.Content class="p-0 h-full flex items-center justify-center">
                <div class="flex flex-col items-center justify-center gap-6">
                    <PawPrint class="w-14 h-14 text-red-500" />
                    <span
                        class="text-6xl font-bold text-red-600 dark:text-red-400"
                    >
                        {hotdogCount}
                    </span>
                    <span
                        class="text-3xl text-center font-medium dark:text-white"
                    >
                        Hotdog in coda
                    </span>
                </div>
            </Card.Content>
        </Card.Root>

        <!-- Hotdog Card -->
        <Card.Root
            class="w-96 h-125 flex flex-col items-center justify-center py-8 p-16"
        >
            <Card.Content class="p-0 h-full flex items-center justify-center">
                <div class="flex flex-col items-center justify-center gap-6">
                    <Leaf class="w-14 h-14 text-green-500" />
                    <span
                        class="text-6xl font-bold text-green-600 dark:text-green-400"
                    >
                        {vegetarianCount}
                    </span>
                    <span
                        class="text-3xl text-center font-medium dark:text-white"
                    >
                        Vegetariani in coda
                    </span>
                </div>
            </Card.Content>
        </Card.Root>

        <!-- Gluten-free Card -->
        <!-- <Card.Root
            class="w-96 h-125 flex flex-col items-center justify-center py-8 p-16"
        >
            <Card.Content class="p-0 h-full flex items-center justify-center">
                <div class="flex flex-col items-center justify-center gap-6">
                    <WheatOff class="w-14 h-14 text-amber-500" />
                    <span
                        class="text-6xl font-bold text-amber-600 dark:text-amber-400"
                    >
                        {glutenFreeCount}
                    </span>
                    <span
                        class="text-3xl text-center font-medium dark:text-white"
                    >
                        Senza glutine in coda
                    </span>
                </div>
            </Card.Content>
        </Card.Root> -->
    </div>
</div>
