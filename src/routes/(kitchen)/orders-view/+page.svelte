<script lang="ts">
    import { ORDERS } from "$lib/firebase/collections";
    import { getStringFromEnumValue } from "$lib/utils/enums";
    import type { Order } from "$models/order";
    import { ItemType, Sauce } from "$models/order";
    import {
        onSnapshot,
        orderBy,
        query,
        Timestamp,
        type Unsubscribe,
    } from "firebase/firestore";
    import {
        Button,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
    } from "flowbite-svelte";
    import { Mail } from "lucide-svelte";
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
    <h1 class="text-2xl font-bold mb-4 text-primary-600">
        Ordini: {orders.length}
    </h1>

    <Table class="w-full">
        <TableHead class="dark:bg-neutral-600 dark:text-neutral-300">
            <TableHeadCell>Ticket ID</TableHeadCell>
            <TableHeadCell>Data</TableHeadCell>
            <TableHeadCell>Nome</TableHeadCell>
            <TableHeadCell>Cognome</TableHeadCell>
            <TableHeadCell>Email</TableHeadCell>
            <TableHeadCell>Dettagli</TableHeadCell>
            <TableHeadCell>Azioni</TableHeadCell>
        </TableHead>
        <TableBody>
            {#each orders as order}
                <TableBodyRow
                    class="w-full dark:bg-neutral-700 dark:border-neutral-500"
                >
                    <TableBodyCell>{order.ticketId}</TableBodyCell>
                    <TableBodyCell
                        >{order.creationDate.toLocaleString()}</TableBodyCell
                    >
                    <TableBodyCell>{order.name}</TableBodyCell>
                    <TableBodyCell>{order.surname}</TableBodyCell>
                    <TableBodyCell>{order.email || "NON STAFF"}</TableBodyCell>
                    <TableBodyCell>
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
                    </TableBodyCell>
                    <TableBodyCell>
                        {#if order.email}
                            <Button
                                size="xs"
                                disabled={loading}
                                onclick={() => resendEmail(order)}
                            >
                                <Mail class="w-4 h-4 mr-2" />
                                Reinvia Email
                            </Button>
                        {/if}
                    </TableBodyCell>
                </TableBodyRow>
            {/each}
        </TableBody>
    </Table>
</div>
