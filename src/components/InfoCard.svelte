<script lang="ts">
    import { getFdPCode } from "$lib/utils/tickets";
    import type { Ticket } from "$models/ticket";
    import { Card } from "flowbite-svelte";

    interface Props {
        ticketCode: string;
        ticket: Ticket | undefined;
        color?: string;
    }

    let {
        ticketCode,
        ticket,
        color,
    }: Props = $props();
</script>

<Card class="w-full flex flex-col text-lg p-3 dark:bg-neutral-700 dark:border-neutral-500" id="ticketInfos">
    <span class="text-black dark:text-white w-full flex justify-between">
        <span>N° biglietto:</span>
        <span
            >{getFdPCode(ticket?.ticketId) ||
                getFdPCode(ticketCode) ||
                ""}</span
        >
    </span>
    <span class="text-black dark:text-white w-full flex justify-between">
        <span>Nominativo:</span>
        <span class="text-right">{(ticket?.name || "") + " " + (ticket?.surname || "")}</span>
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
