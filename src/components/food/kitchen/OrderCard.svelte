<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import Separator from "$lib/components/ui/separator/separator.svelte";
    import { ItemType, type Order, type OrderItem } from "$models/order";
    import { Leaf, TriangleAlert, WheatOff } from "@lucide/svelte";

    interface Props {
        order: Order;
        color: string;
    }

    let { order, color }: Props = $props();

    async function toggleItemReady(order: Order, item: OrderItem) {
        // Toggle the ready status in the local state
        item.ready = !item.ready;

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

<Card.Root class="w-88 h-max border-4  relative" style="border-color: {color}">
    <Card.Header>
        <div class="flex justify-between items-center gap-3">
            <Card.Title class="text-md font-semibold" style="color: {color}">
                {order.name}
                {order.surname}
            </Card.Title>
            <b class="text-lg font-mono">{order.ticketId}</b>
        </div>
    </Card.Header>

    <Card.Content class="flex flex-col gap-4 px-3">
        {#each order.items.toSorted( (a, b) => (a.type == ItemType.MERANER ? 1 : b.type == ItemType.MERANER ? -1 : 0), ) as item}
            <div
                class="p-2 rounded-md {item.type == ItemType.MERANER
                    ? 'bg-red-800/50'
                    : ''}"
            >
                <div class="flex items-baseline gap-2 justify-between">
                    <div class="flex flex-col gap-2 w-full">
                        <div class="flex items-center gap-5 w-full">
                            {#if item.quantity > 1}
                                <span
                                    class="text-2xl font-bold font-mono text-lime-300 size-8 text-center"
                                >
                                    {item.quantity}
                                </span>
                            {/if}
                            <span
                                class="flex gap-2 items-center font-semibold dark:text-white text-gray-700"
                            >
                                {#if item.type == ItemType.VEGETARIANO}
                                    <Leaf
                                        class="text-green-700 bg-green-300 p-1 rounded-md"
                                    />
                                {/if}
                                {item.type.length > 8
                                    ? item.type.slice(0, 7) + "."
                                    : item.type}</span
                            >
                        </div>

                        {#if item.glutenFree}
                            <div
                                class="animate-bounce-custom flex items-center gap-2 text-md text-amber-600 dark:text-amber-400 underline underline-offset-4 font-bold"
                            >
                                <TriangleAlert />
                                <WheatOff
                                    class="text-amber-700 bg-amber-300 p-1 rounded-md"
                                />
                                NO GLUTINE
                                <TriangleAlert />
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
                    </div>
                    <button
                        class="px-2 py-1 text-sm rounded-md font-semibold border-2 text-nowrap
                                    {item.ready
                            ? 'border-app-accent text-app-accent'
                            : 'border-gray-500 text-gray-500 dark:border-neutral-400 dark:text-neutral-400'}"
                        onclick={() => toggleItemReady(order, item)}
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

            <hr class="last:hidden border-2 rounded-full" />
        {/each}
    </Card.Content>

    {#if order.items.every((item) => item.ready === true)}
        <Card.Footer>
            <div class="flex justify-end w-full">
                <Button onclick={() => closeOrder(order.firebaseId)}>
                    Chiudi Ordine
                </Button>
            </div>
        </Card.Footer>
    {/if}
</Card.Root>
