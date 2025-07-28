<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { onDestroy } from "svelte";

    import {
        CheckInTimeSlot,
        computeCheckInPerTime,
        computeOrdersStats,
        computeSalesPerHour,
        computeSalesPerTime,
        computeSellersStats,
        SalesTimeSlot,
    } from "$lib/charts/utils";
    import type { Ticket } from "$models/ticket";
    import { user } from "$store/store";

    import { goto } from "$app/navigation";
    import ExportToCsv from "$components/ExportToCSV.svelte";
    import OrdersECharts from "$components/charts/orders/OrdersECharts.svelte";
    import CheckInPerTimeECharts from "$components/charts/tickets/CheckInPerTimeECharts.svelte";
    import SalesPerTimeECharts from "$components/charts/tickets/SalesPerTimeECharts.svelte";
    import TicketsECharts from "$components/charts/tickets/TicketsECharts.svelte";
    import TicketsPerHourECharts from "$components/charts/tickets/TicketsPerHourECharts.svelte";
    import TicketsPerPersonECharts from "$components/charts/tickets/TicketsPerPersonECharts.svelte";
    import type { User } from "$lib/auth/user";
    import { ORDERS, TICKETS } from "$lib/firebase/collections";
    import type { Order } from "$models/order";
    import { onSnapshot, query, type Unsubscribe } from "firebase/firestore";

    interface Props {
        data: { sellers: User[]; user: User };
    }

    let { data }: Props = $props();
    if (data.user) $user = data.user;

    let tickets: Ticket[] = $state([]);
    let orders: Order[] = $state([]);
    let unsubscribe: Unsubscribe = () => {};

    // cards and pie chart data
    let checkedTicketsCount = $state(0);
    $effect(() => {
        checkedTicketsCount = tickets.filter(
            (ticket) => ticket.checkIn !== null
        ).length;
    });
    let notCheckedTicketsCount = $state(0);
    $effect(() => {
        notCheckedTicketsCount =
            tickets.filter((ticket) => ticket.soldAt !== null).length -
            checkedTicketsCount;
    });
    let notSoldTicketsCount = $state(0);
    $effect(() => {
        notSoldTicketsCount = tickets.filter(
            (ticket) => ticket.soldAt === null
        ).length;
    });

    let timeWindowSalesPerTime: SalesTimeSlot = $state(SalesTimeSlot.DAY);
    let timeWindowCheckInPerTime: CheckInTimeSlot = $state(
        CheckInTimeSlot.HOUR
    );

    let sellersStats = $derived(computeSellersStats(tickets));
    let sellHoursStats = $derived(computeSalesPerHour(tickets));
    let salesPerTime = $derived(
        computeSalesPerTime(tickets, timeWindowSalesPerTime)
    );
    let checkInPerTime = $derived(
        computeCheckInPerTime(tickets, timeWindowCheckInPerTime)
    );

    const ordersStats = $derived(computeOrdersStats(orders));

    const allowedPassphrases = ["Festa di Primavera", "fdp"];

    let open: boolean = $state(true);
    let value: string = $state("");
    let disabled = $derived(!allowedPassphrases.includes(value.trim()));

    // get tickets from firestore
    function getTickets() {
        const q = query(TICKETS);
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            tickets = querySnapshot.docs.map((ticketDoc) => {
                let currSeller: string | null;

                if (!ticketDoc.data().seller) {
                    currSeller = null;
                } else {
                    currSeller =
                        data.sellers?.find(
                            (seller) => seller.id === ticketDoc.data().seller
                        )?.alias || "AnOnImO";
                }

                return {
                    ticketId: ticketDoc.id,
                    name: ticketDoc.data().name,
                    surname: ticketDoc.data().surname,
                    seller: currSeller,
                    soldAt: ticketDoc.data().soldAt?.toDate() || null,
                    checkIn: ticketDoc.data().checkIn?.toDate() || null,
                };
            });
        });
    }

    // get orders from firestore
    function getOrders() {
        const q = query(ORDERS);
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            orders = querySnapshot.docs.map((orderDoc) => {
                return {
                    ...orderDoc.data(),
                } as Order;
            });
        });
    }

    onDestroy(() => {
        unsubscribe();
    });
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
    <div class="flex w-full flex-grow flex-col gap-4 px-5 pb-12 pt-5">
        {#if tickets.length > 0}
            <div
                class="m-auto w-full max-w-sm md:max-w-3xl xl:max-w-6xl 2xl:max-w-[1584px]"
            >
                <h1 class="text-4xl font-bold text-primary-600">Dashboard</h1>
                <p class="text-justify dark:text-white">
                    Informazioni relative ai biglietti
                </p>
            </div>

            <div class="flex flex-col gap-4">
                <div
                    class="m-auto grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                >
                    <div
                        class="grid h-full w-full max-w-sm grid-flow-row-dense grid-cols-2 gap-2"
                    >
                        <Card.Root
                            class="col-span-2 flex h-full w-full max-w-md flex-col items-center justify-center gap-5 pt-6"
                        >
                            <h1
                                class="text-center text-5xl font-bold text-[#4CAF50]"
                            >
                                {checkedTicketsCount !== undefined
                                    ? checkedTicketsCount
                                    : "--"}
                            </h1>
                            <p class="text-center">
                                Biglietti validati
                            </p>
                        </Card.Root>
                        <Card.Root
                            class="flex aspect-square h-full w-full flex-col items-center justify-center gap-5 pt-6"
                        >
                            <h1
                                class="text-center text-5xl font-bold text-[#FFC107]"
                            >
                                {notCheckedTicketsCount !== undefined
                                    ? notCheckedTicketsCount
                                    : "--"}
                            </h1>
                            <p class="text-center">
                                Biglietti venduti non validati
                            </p>
                        </Card.Root>
                        <Card.Root
                            class="flex aspect-square h-full w-full flex-col items-center justify-center gap-5 pt-6"
                        >
                            <h1
                                class="text-center text-5xl font-bold text-[#F44336]"
                            >
                                {notSoldTicketsCount !== undefined
                                    ? notSoldTicketsCount
                                    : "--"}
                            </h1>
                            <p class="text-center">
                                Biglietti non venduti
                            </p>
                        </Card.Root>
                    </div>
                    <TicketsECharts
                        {checkedTicketsCount}
                        {notCheckedTicketsCount}
                        {notSoldTicketsCount}
                    />
                    <TicketsPerPersonECharts {sellersStats} />
                    <TicketsPerHourECharts {sellHoursStats} />
                    <SalesPerTimeECharts
                        ticketsData={salesPerTime}
                        bind:timeWindow={timeWindowSalesPerTime}
                    />
                    <CheckInPerTimeECharts
                        ticketsData={checkInPerTime}
                        bind:timeWindow={timeWindowCheckInPerTime}
                    />
                    <OrdersECharts {ordersStats} />
                </div>
            </div>
            <ExportToCsv bind:tickets />
        {/if}
    </div>
</section>

<Dialog.Root bind:open>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title class="text-2xl text-chart-2">Conferma visita</Dialog.Title>
        </Dialog.Header>
        <div class="">
            <p class="select-none text-sm">
                Per evitare letture non necessarie, confermare di voler visitare
                questa pagina.<br />
                Inserisci nel campo sottostante il codice
                <span
                    class="whitespace-nowrap break-keep rounded-md bg-chart-2/20 px-2 py-1 font-mono"
                    >Festa di Primavera</span
                > per confermare.
            </p>
            <div class="mt-7 flex flex-col gap-1">
                <Label for="confirmation-code">Codice di conferma</Label>
                <Input
                    id="confirmation-code"
                    placeholder="Festa di Primavera"
                    bind:value
                />
            </div>
        </div>
        <Dialog.Footer>
            <Button
                {disabled}
                onclick={() => {
                    if (allowedPassphrases.includes(value.trim())) {
                        getTickets();
                        getOrders();
                        open = false;
                    }
                }}>Conferma</Button
            >
            <Button
                variant="outline"
                onclick={() => goto("/")}>Annulla</Button
            >
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
