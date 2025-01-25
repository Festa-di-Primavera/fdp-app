<script lang="ts">
    import { convertCode } from "$lib/utils/tickets";
    import type { Ticket } from "$models/ticket";
    import { Card } from "flowbite-svelte";

    interface Props {
        ticketCode: string;
        ticket: Ticket | undefined;
        color?: string;
    }

    let {
        ticketCode = $bindable(),
        ticket = $bindable(),
        color = $bindable(""),
    }: Props = $props();
</script>

<Card class="w-full flex flex-col text-lg p-3" id="ticketInfos">
    <span class="text-black dark:text-white w-full flex justify-between">
        <span>N° biglietto:</span>
        <span
            >{convertCode(ticket?.ticketID) ||
                convertCode(ticketCode) ||
                ""}</span
        >
    </span>
    <span class="text-black dark:text-white w-full flex justify-between">
        <span>Nominativo:</span>
        <span>{(ticket?.name || "") + " " + (ticket?.surname || "")}</span>
    </span>
    <span class="text-black dark:text-white w-full flex justify-between">
        <span>Venditore:</span>
        <span>{ticket?.seller || ""}</span>
    </span>
    <span class="text-black dark:text-white w-full flex justify-between">
        <span>Venduto:</span>
        <span
            >{ticket?.soldAt
                ? new Date(ticket.soldAt).toLocaleString("it-IT", {
                      timeZone: "Europe/Rome",
                  })
                : ""}</span
        >
    </span>
    <span class="text-black dark:text-white w-full flex justify-between">
        <span>Entrata:</span>
        <span class="{`text-${color}-400`} font-bold"
            >{ticket?.checkIn
                ? new Date(ticket.checkIn).toLocaleString("it-IT", {
                      timeZone: "Europe/Rome",
                  })
                : ""}</span
        >
    </span>
</Card>
