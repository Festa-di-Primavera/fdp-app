<script lang="ts">
    import { ORDERS } from "$lib/firebase/collections";
    import { type Order, ItemType } from "$models/order";
    import {
        type Unsubscribe,
        onSnapshot,
        query,
        where,
    } from "firebase/firestore";
    import { Card } from "flowbite-svelte";
    import {
        Beef,
        Leaf,
        Sandwich,
        UtensilsCrossed,
        WheatOff,
    } from "lucide-svelte";
    import { onDestroy, onMount } from "svelte";

    let unsubscribe: Unsubscribe = () => {};
    let unsubscribeCompleted: Unsubscribe = () => {}; // New unsubscribe for completed orders

    let inProgressOrders: Order[] = $state([]);
    let completedOrders: Order[] = $state([]); // New state for completed orders

    // Stats data - calculated from order items
    let vegetarianCount = $derived(
        inProgressOrders.reduce((count, order) => {
            // Count vegetarian items in the order
            const vegetarianItems = order.items
                .filter((item) => item.type === ItemType.VEGETARIANO)
                .reduce((total, item) => total + item.quantity, 0);
            return count + vegetarianItems;
        }, 0)
    );

    let ontiCount = $derived(
        inProgressOrders.reduce((count, order) => {
            // Count onti items in the order
            const ontiItems = order.items
                .filter((item) => item.type === ItemType.ONTO)
                .reduce((total, item) => total + item.quantity, 0);
            return count + ontiItems;
        }, 0)
    );

    let basicCount = $derived(
        inProgressOrders.reduce((count, order) => {
            // Count basic items in the order
            const basicItems = order.items
                .filter((item) => item.type === ItemType.BASIC)
                .reduce((total, item) => total + item.quantity, 0);
            return count + basicItems;
        }, 0)
    );

    let nonVegetarianCount = $derived(basicCount + ontiCount);

    let glutenFreeCount = $derived(
        inProgressOrders.reduce((count, order) => {
            // Count gluten-free items in the order
            const glutenFreeItems = order.items
                .filter((item) => item.glutenFree === true)
                .reduce((total, item) => total + item.quantity, 0);
            return count + glutenFreeItems;
        }, 0)
    );

    // Stats for completed orders - total sandwiches and hamburgers
    let totalSandwichesConsumed = $derived(
        completedOrders.reduce((count, order) => {
            // Sum all order items regardless of type
            const sandwichesInOrder = order.items.reduce(
                (total, item) => total + item.quantity,
                0
            );
            return count + sandwichesInOrder;
        }, 0)
    );

    let totalHamburgersConsumed = $derived(
        completedOrders.reduce((count, order) => {
            // Sum only BASIC and ONTO items (which contain meat)
            const hamburgersInOrder = order.items
                .filter(
                    (item) =>
                        item.type === ItemType.BASIC ||
                        item.type === ItemType.ONTO
                )
                .reduce((total, item) => total + item.quantity, 0);
            return count + hamburgersInOrder;
        }, 0)
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
                            completedOrders
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
                            inProgressOrders
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
        otherArray: Order[]
    ) {
        // First remove from the other array if it exists there
        removeOrderFromArray(order.firebaseId, otherArray);

        // Then check if it already exists in target array
        const index = targetArray.findIndex(
            (o) => o.firebaseId === order.firebaseId
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
    <!-- Card con statistiche di consumo -->
    <div
        class="flex-grow flex flex-wrap gap-10 justify-evenly items-center my-16"
    >
        <Card
            class="w-96 dark:bg-neutral-700 dark:border-neutral-500 p-14"
        >
            <div class="flex flex-col items-center justify-center gap-3">
                <Beef class="w-10 h-10 text-red-500" />
                <span class="text-5xl font-bold text-red-600 dark:text-red-400">
                    {totalHamburgersConsumed}
                </span>
                <span class="text-xl text-center font-medium dark:text-white">
                    Hamburger consumati
                </span>
            </div>
        </Card>
        <Card
            class="w-96 dark:bg-neutral-700 dark:border-neutral-500 p-14"
        >
            <div class="flex flex-col items-center justify-center gap-3">
                <Sandwich class="w-10 h-10 text-primary-500" />
                <span
                    class="text-5xl font-bold text-primary-600 dark:text-primary-400"
                >
                    {totalSandwichesConsumed}
                </span>
                <span class="text-xl text-center font-medium dark:text-white">
                    Pane consumato
                </span>
            </div>
        </Card>
    </div>

    <!-- Statistical Cards - centered vertically -->
    <div class="flex-grow flex flex-wrap gap-10 justify-evenly items-center">
        <!-- Non-vegetarian Card Group -->
        <Card
            class="w-96 h-[500px] flex flex-col items-center justify-center py-8 dark:bg-neutral-700 dark:border-neutral-500 p-16"
        >
            <div class="flex flex-col items-center justify-center gap-6">
                <UtensilsCrossed class="w-14 h-14 text-violet-500" />
                <span
                    class="text-6xl font-bold text-violet-600 dark:text-violet-400"
                >
                    {nonVegetarianCount}
                </span>
                <span class="text-3xl text-center font-medium dark:text-white">
                    Non-vegetariani in coda
                </span>

                <!-- Subcategories in separate cards -->
                <div class="flex gap-6 mt-6 w-full">
                    <Card
                        class="flex-1 dark:bg-neutral-600 dark:border-neutral-500 p-14"
                    >
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
                    </Card>

                    <Card
                        class="flex-1 dark:bg-neutral-600 dark:border-neutral-500 p-14"
                    >
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
                    </Card>
                </div>
            </div>
        </Card>

        <!-- Vegetarian Card -->
        <Card
            class="w-96 h-[500px] flex flex-col items-center justify-center py-8 dark:bg-neutral-700 dark:border-neutral-500 p-16"
        >
            <div class="flex flex-col items-center justify-center gap-6">
                <Leaf class="w-14 h-14 text-green-500" />
                <span
                    class="text-6xl font-bold text-green-600 dark:text-green-400"
                >
                    {vegetarianCount}
                </span>
                <span class="text-3xl text-center font-medium dark:text-white">
                    Vegetariani in coda
                </span>
            </div>
        </Card>

        <!-- Gluten-free Card -->
        <Card
            class="w-96 h-[500px] flex flex-col items-center justify-center py-8 dark:bg-neutral-700 dark:border-neutral-500 p-16"
        >
            <div class="flex flex-col items-center justify-center gap-6">
                <WheatOff class="w-14 h-14 text-amber-500" />
                <span
                    class="text-6xl font-bold text-amber-600 dark:text-amber-400"
                >
                    {glutenFreeCount}
                </span>
                <span class="text-3xl text-center font-medium dark:text-white">
                    Senza glutine in coda
                </span>
            </div>
        </Card>
    </div>
</div>
