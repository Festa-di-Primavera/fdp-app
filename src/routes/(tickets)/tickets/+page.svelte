<script lang="ts">
    import FeedbackToast from "$components/feedbacks/FeedbackToast.svelte";
    import type { User } from "$lib/auth/user";
    import { TICKETS } from "$lib/firebase/collections";
    import { formatDate } from "$lib/utils/textFormat";
    import type { Ticket } from "$models/ticket";
    import { user } from "$store/store";
    import { onSnapshot, query, type Unsubscribe } from "firebase/firestore";
    import {
        Button,
        Hr,
        Indicator,
        Input,
        Label,
        Modal,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
    } from "flowbite-svelte";
    import { CheckCircle2, Pen, XCircle } from "lucide-svelte";
    import { onDestroy, onMount } from "svelte";

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

    let color: "green" | "red" = $state("green");
    let feedbackToastMessage: string = $state("");
    let error: boolean = $state(false);
    let feedbackToastOpen: boolean = $state(false);
    let timeOut: NodeJS.Timeout;

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
    let ToastIcon = $derived(error ? XCircle : CheckCircle2);

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
                error = false;
                feedbackToastMessage = "Attributo cambiato";
                feedbackToastOpen = true;
            }

            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                feedbackToastOpen = false;
                clearTimeout(timeOut);
            }, 3500);
            attribute = "";
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
        <Label>
            Nome
            <Input
                bind:value={filters.name}
                placeholder="Mario"
                class="mt-1 w-full dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
            />
        </Label>
        <Label>
            Cognome
            <Input
                bind:value={filters.surname}
                placeholder="Rossi"
                class="mt-1 w-full dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
            />
        </Label>
        <Label>
            Codice Biglietto
            <Input
                bind:value={filters.ticketId}
                placeholder="FDP25-0000"
                class="mt-1 w-full dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
            />
        </Label>
        <Label>
            Venditore
            <Input
                bind:value={filters.seller}
                placeholder="Marek"
                class="mt-1 w-full dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
            />
        </Label>
    </div>

    <Hr class="mx-5 mt-5 dark:bg-neutral-500" />
    <div class="mx-5">
        <Table
            divClass="tableDiv relative overflow-x-auto overflow-y-visible pb-40"
            class="relative overflow-visible overflow-x-auto rounded-md shadow-md sm:rounded-lg"
        >
            <TableHead class="dark:bg-neutral-600 dark:text-neutral-300">
                <TableHeadCell class="cursor-pointer select-none">
                    <div class="flex gap-1">Codice</div>
                </TableHeadCell>
                <TableHeadCell class="cursor-pointer select-none">
                    <div class="flex gap-1">Nome</div>
                </TableHeadCell>
                <TableHeadCell class="cursor-pointer select-none">
                    <div class="flex gap-1">Cognome</div>
                </TableHeadCell>
                <TableHeadCell class="cursor-pointer select-none">
                    <div class="flex gap-1">Venditore</div>
                </TableHeadCell>
                <TableHeadCell class="cursor-pointer select-none">
                    <div class="flex gap-1">Vendita</div>
                </TableHeadCell>
                <TableHeadCell class="cursor-pointer select-none">
                    <div class="flex gap-1">Check-in</div>
                </TableHeadCell>
            </TableHead>
            <TableBody class="divide-y">
                {#each filteredItems || [] as item}
                    <TableBodyRow
                        class="w-full dark:bg-neutral-700 dark:border-neutral-500"
                    >
                        <TableBodyCell
                            class="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-4"
                        >
                            <span class="mr-4">{item.ticketId}</span>
                        </TableBodyCell>
                        <TableBodyCell>
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
                        </TableBodyCell>
                        <TableBodyCell>
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
                        </TableBodyCell>
                        <TableBodyCell>
                            <div
                                class="flex w-full items-center justify-between gap-3"
                            >
                                {item.seller || "------"}
                            </div>
                        </TableBodyCell>
                        <TableBodyCell>
                            <span class="flex items-center gap-2">
                                <Indicator
                                    color={item.soldAt ? "green" : "red"}
                                />
                                {formatDate(item.soldAt, "Non venduto")}
                            </span>
                        </TableBodyCell>
                        <TableBodyCell>
                            <span class="flex items-center gap-2">
                                <Indicator
                                    color={item.checkIn ? "green" : "yellow"}
                                />
                                <span class="w-max"
                                    >{formatDate(
                                        item.checkIn,
                                        "Non effettuato"
                                    )}</span
                                >
                            </span>
                        </TableBodyCell>
                    </TableBodyRow>
                {/each}
            </TableBody>
        </Table>
    </div>
{/if}

<FeedbackToast
    bind:open={feedbackToastOpen}
    bind:color
    bind:message={feedbackToastMessage}
    {ToastIcon}
/>
<Modal
    autoclose
    outsideclose
    bind:open={attrModalOpen}
    title={`Cambia il ${currAttr == "name" ? "nome" : "cognome"} di ${currSelectedTicket?.name} ${currSelectedTicket?.surname}`}
    class="z-50 dark:bg-neutral-800 dark:divide-neutral-500 dark:text-neutral-300"
    headerClass="dark:bg-neutral-800 dark:text-neutral-300"
    footerClass="dark:bg-neutral-800 dark:text-neutral-300"
>
    <span class="text-md"
        >Vuoi aggiornare il {currAttr == "name" ? "nome" : "cognome"} di
        <b>{currSelectedTicket?.name} {currSelectedTicket?.surname}</b>?</span
    >
    <div class="flex flex-col gap-2">
        <span class="text-sm">Biglietto: {currSelectedTicket?.ticketId}</span>
        <span class="text-sm">Nome: {currSelectedTicket?.name}</span>
        <span class="text-sm">Cognome: {currSelectedTicket?.surname}</span>
        <span class="text-sm">Venditore: {currSelectedTicket?.seller}</span>
    </div>
    <Input
        bind:value={attribute}
        class="mt-4 dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
        placeholder={currSelectedTicket!![currAttr!!]}
    />
    {#snippet footer()}
        <div class="flex gap-2">
            <Button onclick={() => handleAttrModify()}>Aggiorna</Button>
            <Button
                color="alternative"
                class="dark:text-neutral-400 dark:border-neutral-400 dark:hover:bg-neutral-700 dark:hover:border-neutral-300"
                onclick={() => {
                    attribute = "";
                    attrModalOpen = false;
                }}
            >
                Annulla
            </Button>
        </div>
    {/snippet}
</Modal>
