<script lang="ts">
    import { ItemType, type Order } from "$models/order";
    import { Button, Card } from "flowbite-svelte";
    import { AlertTriangle, Leaf } from "lucide-svelte";

    interface Props {
        order: Order;
        color: string;
    }

    let { order, color }: Props = $props();

    async function toggleItemReady(order: Order, itemIndex: number) {
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

<Card
    class="w-[22rem] h-max border-t-4 relative dark:bg-neutral-700"
    style="border-top-color: {color}"
    border={false}
>
    <div class="flex justify-between items-center gap-3 mb-4">
        <h2 class="text-md font-semibold" style="color: {color}">
            {order.name}
            {order.surname}
        </h2>
        <span class="text-lg text-gray-700 dark:text-gray-200">
            <span class="font-mono">
                <b>{order.ticketId}</b>
            </span>
        </span>
    </div>

    <div class="space-y-3 dark:text-white">
        {#each order.items as item, itemIndex}
            <div
                class="border-b-2 border-gray-200 dark:border-gray-400 pb-3 last:border-0"
            >
                <div class="flex items-baseline gap-2 justify-between">
                    <div class="flex flex-col gap-2 w-full">
                        <div class="flex items-center gap-5 w-full">
                            <span
                                class="flex gap-2 items-center font-semibold dark:text-white text-gray-700"
                            >
                                {#if item.type == ItemType.VEGETARIANO}
                                    <Leaf
                                        class="text-green-700 bg-green-300 p-1 rounded-md"
                                    />
                                {/if}
                                {item.type.length > 6
                                    ? item.type.slice(0, 5) + "."
                                    : item.type}</span
                            >
                            <span
                                class="text-xl font-semibold font-mono text-lime-300"
                                >x{item.quantity}</span
                            >
                        </div>

                        {#if item.glutenFree}
                            <div
                                class="animate-bounce-custom flex items-center gap-2 text-md text-amber-600 dark:text-amber-400 underline underline-offset-4 font-bold"
                            >
                                <AlertTriangle />
                                NO GLUTINE
                                <AlertTriangle />
                            </div>
                            <style>
                                @keyframes bounce {
                                    0%,
                                    100% {
                                        transform: translateY(-20%);
                                        animation-timing-function: cubic-bezier(
                                            0.8,
                                            0,
                                            1,
                                            1
                                        );
                                    }
                                    50% {
                                        transform: none;
                                        animation-timing-function: cubic-bezier(
                                            0,
                                            0,
                                            0.2,
                                            1
                                        );
                                    }
                                }
                                .animate-bounce-custom {
                                    animation: bounce 0.65s infinite;
                                }
                            </style>
                        {/if}
                        {#if item.sauce}
                            <span
                                class="text-md text-green-500 dark:text-green-300 font-semibold"
                                >{item.sauce}</span
                            >
                        {/if}
                    </div>
                    <button
                        class="px-2 py-1 text-sm rounded-md font-semibold border-2
                                    {item.ready
                            ? 'border-primary-400 text-primary-400'
                            : 'border-gray-500 text-gray-500 dark:border-neutral-400 dark:text-neutral-400'}"
                        onclick={() => toggleItemReady(order, itemIndex)}
                    >
                        {item.ready ? "✓ Pronto" : "Pronto"}
                    </button>
                </div>

                {#if item.removedIngredients?.length}
                    <ul class="text-sm mt-1 font-semibold list-disc ml-5">
                        {#each item.removedIngredients as ingredient}
                            <li>NO {ingredient}</li>
                        {/each}
                    </ul>
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
