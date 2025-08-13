<script lang="ts">
    import {
        BaseIngredient,
        DEFAULT_INGREDIENTS,
        type Order,
        type OrderItem,
    } from "$models/order";
    import { Badge } from "$lib/components/ui/badge/index";
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { TriangleAlert } from "@lucide/svelte";

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
                    creationDate: new Date(),
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
    <Card.Root class="w-full max-w-96">
        <Card.Content>
            <h1 class="text-2xl font-bold mb-4 text-app-accent">Riepilogo Ordine</h1>

            <Card.Root class="mb-4">
                <Card.Content>
                    <h2 class="text-xl font-semibold mb-2">
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
                </Card.Content>
            </Card.Root>

            <!-- Order items -->
            <Card.Root class="mb-4">
                <Card.Content>
                    <h2 class="text-xl font-semibold mb-2">Dettagli Ordine</h2>
                    <div class="space-y-4">
                        {#each order.items as item, i}
                            <div>
                                <div class="flex justify-between items-start">
                                    <div class="flex gap-4 items-center">
                                        <h3 class="text-lg font-medium">
                                            {item.quantity}x {item.type}
                                        </h3>
                                        {#if item.glutenFree}
                                            <Badge
                                                variant="outline"
                                                class="bg-orange-100 text-orange-800 border-orange-300"
                                            >
                                                Senza glutine
                                            </Badge>
                                        {/if}
                                    </div>
                                </div>

                                {#if item.notes}
                                    <div class="mt-2">
                                        <p
                                            class="text-sm text-muted-foreground"
                                        >
                                            📝 Note: {item.notes}
                                        </p>
                                    </div>
                                {/if}

                                {#if item.sauce}
                                    <div class="mt-2">
                                        <p
                                            class="text-sm text-muted-foreground"
                                        >
                                            🥫 Salsa: {item.sauce}
                                        </p>
                                    </div>
                                {/if}

                                <div class="flex justify-between divide-x-2">
                                    <div class="mt-3 w-full">
                                        <h4 class="text-sm font-medium mb-1">
                                            Ingredienti:
                                        </h4>
                                        <ul
                                            class="list-disc list-inside text-sm"
                                        >
                                            {#each getRemainingIngredients(item) as ingredient}
                                                <li>{ingredient}</li>
                                            {/each}
                                        </ul>
                                    </div>
                                    {#if item.removedIngredients && item.removedIngredients.length > 0}
                                        <div
                                            class="mt-3 border-border w-full pl-6"
                                        >
                                            <h4
                                                class="text-sm font-medium mb-1 text-red-400"
                                            >
                                                Ingredienti rimossi:
                                            </h4>
                                            <ul
                                                class="list-disc list-inside text-sm text-red-400"
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
                </Card.Content>
            </Card.Root>

            <!-- Action button -->
            <div class="w-full flex justify-center">
                {#if order.done === null}
                    <Button
                        onclick={sendToKitchen}
                        disabled={loading}
                        class="w-full"
                    >
                        {loading
                            ? "Invio in corso..."
                            : "Invia ordine alla cucina"}
                    </Button>
                {:else if order.done === false}
                    <div
                        class="flex self-center justify-center text-md w-max bg-orange-100 text-orange-700 p-2 rounded-lg"
                    >
                        Ordine inviato alla cucina
                    </div>
                {:else}
                    <div
                        class="flex self-center justify-center text-md w-max bg-red-100 text-red-700 p-2 rounded-lg"
                    >
                        Ordine già consegnato
                    </div>
                {/if}
            </div>
        </Card.Content>
    </Card.Root>
</section>

<!-- Confirmation Modal -->
<Dialog.Root bind:open={showConfirmModal}>
    <Dialog.Content class="max-w-md">
        <Dialog.Header>
            <Dialog.Title class="flex gap-3 items-center">
                <TriangleAlert class="size-6 text-red-500" />
                Conferma invio ordine
                <TriangleAlert class="size-6 text-red-500" />
            </Dialog.Title>
        </Dialog.Header>

        <div class="mb-4">
            <p>Sei sicuro di voler inviare questo ordine alla cucina?</p>
            <p class="text-sm text-muted-foreground mt-2">
                Una volta inviato, l'ordine sarà visibile alla cucina e non
                potrà essere annullato⚠️<br /><br />
                <span class="font-semibold">
                    Mettiti in coda appena clicchi su <i class="text-primary"
                        >"Conferma"</i
                    >
                </span>
            </p>
        </div>

        <Dialog.Footer class="flex justify-end gap-3">
            <Button
                variant="outline"
                onclick={() => (showConfirmModal = false)}
            >
                Annulla
            </Button>
            <Button onclick={confirmSendToKitchen}>Conferma</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
