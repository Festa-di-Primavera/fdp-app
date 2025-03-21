<script lang="ts">
    import {
        BaseIngredient,
        DEFAULT_INGREDIENTS,
        type Order,
        type OrderItem,
    } from "$models/order";
    import { Badge, Button, Card, Modal } from "flowbite-svelte";

    let { data } = $props();
    let order: Order | null = $state(data.order);
    let loading = $state(false);
    let error = $state(false);
    let showConfirmModal = $state(false);

    async function sendToKitchen() {
        if (!order || order.done !== null) return;
        
        // Show confirmation modal instead of immediately sending
        showConfirmModal = true;
    }
    
    async function confirmSendToKitchen() {
        showConfirmModal = false;
        
        if (!order || order.done !== null) return;

        loading = true;
        try {
            // Use the existing API endpoint
            const response = await fetch(`/api/order/manual-orders`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: order.firebaseId,
                    done: false,
                }),
            });

            if (response.ok) {
                order.done = false;
            } else {
                throw new Error("Failed to send order to kitchen");
            }
        } catch (err) {
            console.error("Error sending order to kitchen:", err);
            error = true;
        } finally {
            loading = false;
        }
    }

    function getRemainingIngredients(item: OrderItem): BaseIngredient[] {
        if (!item.removedIngredients || item.removedIngredients.length === 0) {
            return DEFAULT_INGREDIENTS[item.type];
        }

        return DEFAULT_INGREDIENTS[item.type].filter(
            (ingredient) => !item.removedIngredients?.includes(ingredient)
        );
    }
</script>

<svelte:head><title>Ordine Staff</title></svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center py-8 px-4">
    <Card
        padding="xl"
        class="w-full dark:text-white dark:bg-neutral-700 dark:border-neutral-500"
    >
        <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Riepilogo Ordine
        </h1>

        <Card class="mb-4 dark:text-white dark:bg-neutral-600" border={false}>
            <h2
                class="text-xl font-semibold mb-2 text-gray-900 dark:text-white"
            >
                Informazioni Personali
            </h2>
            <div class="space-y-2">
                <p>
                    <span class="font-medium">Nome:</span>
                    {order.name}
                    {order.surname}
                </p>
                {#if order.email}
                    <p>
                        <span class="font-medium">Email:</span>
                        {order.email}
                    </p>
                {/if}
            </div>
        </Card>

        <!-- Order items -->
        <Card class="mb-4 dark:text-white dark:bg-neutral-600" border={false}>
            <h2
                class="text-xl font-semibold mb-2 text-gray-900 dark:text-white"
            >
                Dettagli Ordine
            </h2>
            <div class="space-y-4">
                {#each order.items as item, i}
                    <div>
                        <div class="flex justify-between items-start">
                            <div class="flex gap-4 items-center">
                                <h3 class="text-lg font-medium">
                                    {item.quantity}x {item.type}
                                </h3>
                                {#if item.glutenFree}
                                    <Badge color="yellow" class="mt-1"
                                        >Senza glutine</Badge
                                    >
                                {/if}
                            </div>
                        </div>

                        {#if item.notes}
                            <div class="mt-2">
                                <p
                                    class="text-sm text-gray-500 dark:text-gray-400"
                                >
                                    📝 Note: {item.notes}
                                </p>
                            </div>
                        {/if}

                        {#if item.sauce}
                            <div class="mt-2">
                                <p
                                    class="text-sm text-gray-500 dark:text-gray-400"
                                >
                                    🥫 Salsa: {item.sauce}
                                </p>
                            </div>
                        {/if}

                        <div
                            class="flex justify-between divide-x-2 dark:text-white"
                        >
                            <div class="mt-3">
                                <h4 class="text-sm font-medium mb-1">
                                    Ingredienti:
                                </h4>
                                <ul class="list-disc list-inside text-sm">
                                    {#each getRemainingIngredients(item) as ingredient}
                                        <li>{ingredient}</li>
                                    {/each}
                                </ul>
                            </div>
                            {#if item.removedIngredients && item.removedIngredients.length > 0}
                                <div class="mt-3 pl-3 border-neutral-500">
                                    <h4
                                        class="text-sm font-medium mb-1 text-red-600 dark:text-red-400"
                                    >
                                        Ingredienti rimossi:
                                    </h4>
                                    <ul
                                        class="list-disc list-inside text-sm text-red-600 dark:text-red-400"
                                    >
                                        {#each item.removedIngredients as ingredient}
                                            <li>{ingredient}</li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </Card>

        <!-- Action button -->
        {#if order.done === null}
            <Button onclick={sendToKitchen} disabled={loading} class="w-full">
                {loading ? "Invio in corso..." : "Invia ordine alla cucina"}
            </Button>
        {:else if order.done === false}
            <div class="flex self-center justify-center text-md w-max dark:bg-opacity-50 bg-opacity-50 bg-orange-400 text-orange-700 dark:bg-orange-700 dark:text-orange-300 p-2 rounded-lg">
                Ordine inviato alla cucina                
            </div>
        {:else}
            <div class="flex self-center justify-center text-md w-max dark:bg-opacity-50 bg-opacity-50 bg-red-400 text-red-700 dark:bg-red-700 dark:text-red-300 p-2 rounded-lg">
                Ordine già consegnato
            </div>
        {/if}
    </Card>
</section>

<!-- Confirmation Modal -->
<Modal
    bind:open={showConfirmModal}
    size="md"
    class="z-50 dark:bg-neutral-800 dark:divide-neutral-500 dark:text-neutral-300"
    classHeader="dark:bg-neutral-800 dark:text-neutral-300"
    classFooter="dark:bg-neutral-800 dark:text-neutral-300"
>
    <h2 class="text-xl font-bold" slot="header">
        Conferma invio ordine
    </h2>
    
    <div class="mb-4">
        <p>Sei sicuro di voler inviare questo ordine alla cucina?</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Una volta inviato, l'ordine sarà visibile alla cucina e non potrà essere annullato.
        </p>
    </div>

    <div class="flex justify-end gap-3">
        <Button
            color="alternative"
            class="dark:text-neutral-400 dark:border-neutral-400 dark:hover:bg-neutral-700 dark:hover:border-neutral-300"
            onclick={() => (showConfirmModal = false)}>
            Annulla
        </Button>
        <Button 
            color="primary" 
            onclick={confirmSendToKitchen}>
            Conferma
        </Button>
    </div>
</Modal>
