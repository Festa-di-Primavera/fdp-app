<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Table from "$lib/components/ui/table/index.js";
    import { ORDERS } from "$lib/firebase/collections";
    import { getStringFromEnumValue } from "$lib/utils/enums";
    import type { Order } from "$models/order";
    import { ItemType, Sauce } from "$models/order";
    import { Mail } from "@lucide/svelte";
    import {
        onSnapshot,
        orderBy,
        query,
        Timestamp,
        type Unsubscribe,
    } from "firebase/firestore";
    import { onDestroy, onMount } from "svelte";

    let orders: Order[] = $state([]);
    let unsubscribe: Unsubscribe = () => {};
    let loading = $state(false);

    function getOrders() {
        const q = query(ORDERS, orderBy("creationDate", "asc"));

        unsubscribe = onSnapshot(q, (querySnapshot) => {
            orders = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                ticketId: doc.id,
                creationDate: (doc.data().creationDate as Timestamp).toDate(),
            })) as Order[];
        });
    }

    onMount(() => {
        getOrders();
    });

    onDestroy(() => {
        unsubscribe();
    });

    async function resendEmail(order: Order) {
        loading = true;
        try {
            const response = await fetch("/api/order/manual-orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: order.ticketId,
                    name: order.name,
                    surname: order.surname,
                    email: order.email,
                    order: order,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to resend email");
            }

            alert("Email inviata con successo!");
        } catch (error) {
            console.error("Error resending email:", error);
            alert("Errore nell'invio dell'email");
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Visualizza Ordini</title>
</svelte:head>

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4 text-app-accent">
        Ordini: {orders.length}
    </h1>

    <Table.Root class="w-full">
        <Table.Header>
            <Table.Row>
                <Table.Head>Ticket ID</Table.Head>
                <Table.Head>Data</Table.Head>
                <Table.Head>Nome</Table.Head>
                <Table.Head>Cognome</Table.Head>
                <Table.Head>Email</Table.Head>
                <Table.Head>Dettagli</Table.Head>
                <Table.Head>Azioni</Table.Head>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#each orders as order}
                <Table.Row class="w-full">
                    <Table.Cell>{order.ticketId}</Table.Cell>
                    <Table.Cell
                        >{order.creationDate.toLocaleString()}</Table.Cell
                    >
                    <Table.Cell>{order.name}</Table.Cell>
                    <Table.Cell>{order.surname}</Table.Cell>
                    <Table.Cell>{order.email || "NON STAFF"}</Table.Cell>
                    <Table.Cell>
                        {#each order.items as item}
                            <p class="mb-1">
                                {getStringFromEnumValue(ItemType, item.type)}
                                {#if item.sauce}
                                    - {getStringFromEnumValue(
                                        Sauce,
                                        item.sauce
                                    )}
                                {/if}
                                {#if item.glutenFree}
                                    - SENZA GLUTINE
                                {/if}
                            </p>
                        {/each}
                    </Table.Cell>
                    <Table.Cell>
                        {#if order.email}
                            <Button
                                size="sm"
                                disabled={loading}
                                onclick={() => resendEmail(order)}
                            >
                                <Mail class="w-4 h-4 mr-2" />
                                Reinvia Email
                            </Button>
                        {/if}
                    </Table.Cell>
                </Table.Row>
            {/each}
        </Table.Body>
    </Table.Root>
</div>
