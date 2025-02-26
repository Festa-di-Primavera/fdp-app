<script lang="ts">
    import { getClientDB } from "$lib/firebase/client";
    import { getStringFromEnumValue } from "$lib/utils/enums";
    import type { Order } from "$models/order";
    import { ItemType, Sauce } from "$models/order";
    import {
        Button,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
    } from "flowbite-svelte";
    import {
        collection,
        onSnapshot,
        orderBy,
        query,
        where,
        type Unsubscribe,
    } from "firebase/firestore";
    import { Mail } from "lucide-svelte";
    import { onDestroy, onMount } from "svelte";

    let orders: Order[] = $state([]);
    let unsubscribe: Unsubscribe = () => {};
    let loading = $state(false);

    function getOrders() {
        const q = query(
            collection(getClientDB(), "orders"),
            where("ticketId", ">=", "XNRF"),
            where("ticketId", "<=", "XNRF\uf8ff"),
            orderBy("ticketId", "asc")
        );

        unsubscribe = onSnapshot(q, (querySnapshot) => {
            orders = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                ticketId: doc.id,
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
            const response = await fetch("/api/order/don-bosco", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: order.name.split(" ")[0],
                    surname: order.name.split(" ")[1].replace(".", ""),
                    email: "mattiavanzo@diocesitn.it",
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

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Ordini Don Bosco {orders.length}</h1>

    <Table striped={true}>
        <TableHead>
            <TableHeadCell>Ticket ID</TableHeadCell>
            <TableHeadCell>Data</TableHeadCell>
            <TableHeadCell>Nome</TableHeadCell>
            <TableHeadCell>Dettagli</TableHeadCell>
            <TableHeadCell>Azioni</TableHeadCell>
        </TableHead>
        <TableBody>
            {#each orders as order}
                <TableBodyRow>
                    <TableBodyCell>{order.ticketId}</TableBodyCell>
                    <TableBodyCell
                        >{order.timestamp.toLocaleString()}</TableBodyCell
                    >
                    <TableBodyCell>{order.name}</TableBodyCell>
                    <TableBodyCell>
                        {#each order.items as item}
                            <p class="mb-1">
                                {getStringFromEnumValue(ItemType, item.type)}
                                {#if item.sauce}
                                    - {getStringFromEnumValue(Sauce, item.sauce)}
                                {/if}
                                {#if item.glutenFree}
                                    - SENZA GLUTINE
                                {/if}
                            </p>
                        {/each}
                    </TableBodyCell>
                    <TableBodyCell>
                        <Button
                            size="xs"
                            disabled={loading}
                            on:click={() => resendEmail(order)}
                        >
                            <Mail class="w-4 h-4 mr-2" />
                            Reinvia Email
                        </Button>
                    </TableBodyCell>
                </TableBodyRow>
            {/each}
        </TableBody>
    </Table>
</div>
