<script lang="ts">
    import type { User } from "$lib/auth/user";
    import { Badge } from "$lib/components/ui/badge/index";
    import { Button } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as Table from "$lib/components/ui/table/index";
    import { TICKETS } from "$lib/firebase/collections";
    import { formatDate } from "$lib/utils/textFormat";
    import type { Ticket } from "$models/ticket";
    import { user } from "$store/store";
    import { Pen } from "@lucide/svelte";
    import { onSnapshot, query, type Unsubscribe } from "firebase/firestore";
    import { onDestroy, onMount } from "svelte";
    import { toast } from "svelte-sonner";

    interface Props {
        data: { currUser: User; sellers: Map<string, string> };
    }

    let { data }: Props = $props();

    if (!$user) $user = data.currUser;

    let unsubscribe: Unsubscribe = () => {};

    function getTickets() {
        const q = query(TICKETS);
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            tickets = querySnapshot.docs.map((ticketDoc) => {
                const currentTicket = ticketDoc.data();
                const sellerName =
                    data.sellers.get(currentTicket.seller) || "Anonimo";

                return {
                    ticketId: ticketDoc.id,
                    name: currentTicket.name,
                    surname: currentTicket.surname,
                    seller: sellerName,
                    soldAt: currentTicket.soldAt?.toDate() || null,
                    checkIn: currentTicket.checkIn?.toDate() || null,
                };
            });
        });
    }

    onMount(() => {
        getTickets();
    });

    onDestroy(() => {
        unsubscribe();
    });

    let tickets: Ticket[] = $state([]);

    const filters = $state({
        name: "",
        surname: "",
        ticketId: "",
        seller: "",
    });

    let filteredItems: Ticket[] = $state([]);

    $effect(() => {
        filteredItems = tickets?.filter((item: Ticket) => {
            // filter by name, surname, ticketId, seller if the value is not empty
            return (
                (item.name
                    ?.toLowerCase()
                    .includes(filters.name.toLowerCase()) ||
                    filters.name === "") &&
                (item.surname
                    ?.toLowerCase()
                    .includes(filters.surname.toLowerCase()) ||
                    filters.surname === "") &&
                (item.ticketId
                    ?.toLowerCase()
                    .includes(filters.ticketId.toLowerCase()) ||
                    filters.ticketId === "") &&
                (item.seller
                    ?.toLowerCase()
                    .includes(filters.seller.toLowerCase()) ||
                    filters.seller === "")
            );
        });
    });

    let currSelectedTicket: Ticket | undefined = $state();

    let attrModalOpen: boolean = $state(false);
    let attribute: string = $state("");
    let currAttr: "name" | "surname" | undefined = $state();

    const triggerAttrModify = async (
        ticket: Ticket,
        attr: "name" | "surname"
    ) => {
        currSelectedTicket = ticket;
        attrModalOpen = true;
        currAttr = attr;
    };

    async function handleAttrModify() {
        if (attribute != "" && currSelectedTicket && currAttr) {
            const response = await fetch("/api/tickets", {
                method: "PUT",
                body: JSON.stringify({
                    attribute,
                    toChange: currAttr,
                    ticketId: currSelectedTicket.ticketId,
                }),
            });
            if (response.ok) {
                toast.success("Attributo cambiato");
                // Close modal and reset form after successful update
                attribute = "";
                attrModalOpen = false;
            } else {
                toast.error("Errore durante la modifica");
                // Keep modal open on error so user can retry
            }
        }
    }
</script>

<svelte:head>
    <title>Biglietti</title>
</svelte:head>

{#if $user}
    <div
        class="mr-5 mt-5 grid w-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 px-5"
    >
        <div class="space-y-2">
            <Label for="name-filter">Nome</Label>
            <Input
                id="name-filter"
                bind:value={filters.name}
                placeholder="Mario"
            />
        </div>
        <div class="space-y-2">
            <Label for="surname-filter">Cognome</Label>
            <Input
                id="surname-filter"
                bind:value={filters.surname}
                placeholder="Rossi"
            />
        </div>
        <div class="space-y-2">
            <Label for="ticket-filter">Codice Biglietto</Label>
            <Input
                id="ticket-filter"
                bind:value={filters.ticketId}
                placeholder={`FDP${new Date().getFullYear().toString().slice(-2)}-0000`}
            />
        </div>
        <div class="space-y-2">
            <Label for="seller-filter">Venditore</Label>
            <Input
                id="seller-filter"
                bind:value={filters.seller}
                placeholder="Marek"
            />
        </div>
    </div>

    <div class="mx-5 mt-5">
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head class="cursor-pointer select-none">
                        <div class="flex gap-1">Codice</div>
                    </Table.Head>
                    <Table.Head class="cursor-pointer select-none">
                        <div class="flex gap-1">Nome</div>
                    </Table.Head>
                    <Table.Head class="cursor-pointer select-none">
                        <div class="flex gap-1">Cognome</div>
                    </Table.Head>
                    <Table.Head class="cursor-pointer select-none">
                        <div class="flex gap-1">Venditore</div>
                    </Table.Head>
                    <Table.Head class="cursor-pointer select-none">
                        <div class="flex gap-1">Vendita</div>
                    </Table.Head>
                    <Table.Head class="cursor-pointer select-none">
                        <div class="flex gap-1">Check-in</div>
                    </Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each filteredItems || [] as item}
                    <Table.Row>
                        <Table.Cell
                            class="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-4"
                        >
                            <span class="mr-4">{item.ticketId}</span>
                        </Table.Cell>
                        <Table.Cell>
                            {#if item.name}
                                <div class="flex items-center">
                                    <span class="inline-block min-w-[100px]"
                                        >{item.name}</span
                                    >
                                    <button
                                        class="ml-2"
                                        onclick={() => {
                                            triggerAttrModify(item, "name");
                                        }}
                                    >
                                        <Pen class="w-4" />
                                    </button>
                                </div>
                            {:else}
                                {"------"}
                            {/if}
                        </Table.Cell>
                        <Table.Cell>
                            {#if item.surname}
                                <div class="flex items-center">
                                    <span class="inline-block min-w-[100px]"
                                        >{item.surname}</span
                                    >
                                    <button
                                        class="ml-2"
                                        onclick={() =>
                                            triggerAttrModify(item, "surname")}
                                    >
                                        <Pen class="w-4" />
                                    </button>
                                </div>
                            {:else}
                                {"------"}
                            {/if}
                        </Table.Cell>
                        <Table.Cell>
                            <div
                                class="flex w-full items-center justify-between gap-3"
                            >
                                {item.seller || "------"}
                            </div>
                        </Table.Cell>
                        <Table.Cell>
                            <span class="flex items-center gap-2">
                                <Badge
                                    class="h-3 min-w-3 rounded-full px-1 font-mono tabular-nums {item.soldAt
                                        ? 'bg-green-500'
                                        : 'bg-red-500'}"
                                />
                                {formatDate(item.soldAt, "Non venduto")}
                            </span>
                        </Table.Cell>
                        <Table.Cell>
                            <span class="flex items-center gap-2">
                                <Badge
                                    class="h-3 min-w-3 rounded-full px-1 font-mono tabular-nums {item.checkIn
                                        ? 'bg-green-500'
                                        : 'bg-yellow-500'}"
                                />
                                <span class="w-max"
                                    >{formatDate(
                                        item.checkIn,
                                        "Non effettuato"
                                    )}</span
                                >
                            </span>
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    </div>
{/if}

<Dialog.Root bind:open={attrModalOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title
                >Cambia il {currAttr == "name" ? "nome" : "cognome"} di {currSelectedTicket?.name}
                {currSelectedTicket?.surname}</Dialog.Title
            >
        </Dialog.Header>
        <span class="text-md"
            >Vuoi aggiornare il {currAttr == "name" ? "nome" : "cognome"} di
            <b>{currSelectedTicket?.name} {currSelectedTicket?.surname}</b
            >?</span
        >
        <div class="flex flex-col gap-2">
            <span class="text-sm"
                >Biglietto: {currSelectedTicket?.ticketId}</span
            >
            <span class="text-sm">Nome: {currSelectedTicket?.name}</span>
            <span class="text-sm">Cognome: {currSelectedTicket?.surname}</span>
            <span class="text-sm">Venditore: {currSelectedTicket?.seller}</span>
        </div>
        <Input
            bind:value={attribute}
            class="mt-4"
            placeholder={currSelectedTicket!![currAttr!!]}
        />
        <Dialog.Footer>
            <Button onclick={() => handleAttrModify()}>Aggiorna</Button>
            <Button
                variant="outline"
                onclick={() => {
                    attribute = "";
                    attrModalOpen = false;
                }}
            >
                Annulla
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
