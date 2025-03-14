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
    <div class="flex justify-between items-center mb-4">
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
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-2">
                            {#if item.type == ItemType.VEGETARIANO}
                                <Leaf class="text-green-400" />
                            {/if}
                            <span
                                class="font-semibold dark:text-white text-gray-700"
                            >
                                {item.type.length > 6
                                    ? item.type.slice(0, 5) + "."
                                    : item.type}</span
                            >
                            <span
                                class="text-xl font-semibold font-mono text-primary-300"
                                >x{item.quantity}</span
                            >
                        </div>

                        {#if item.glutenFree}
                            <div
                                class="flex items-center gap-2 text-md text-red-500 dark:text-red-400 font-bold"
                            >
                                <AlertTriangle />
                                NO GLUTINE
                                <AlertTriangle />
                            </div>
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
