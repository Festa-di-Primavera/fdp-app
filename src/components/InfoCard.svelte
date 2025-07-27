<script lang="ts">
    import * as Card from "$lib/components/ui/card/index";
    import * as Separator from "$lib/components/ui/separator/index";
    import { getFdPCode } from "$lib/utils/tickets";
    import type { Ticket } from "$models/ticket";
    import { Info } from "lucide-svelte";

    interface Props {
        ticketCode: string;
        ticket: Ticket | undefined;
        color?: string;
    }

    let { ticketCode, ticket, color }: Props = $props();
</script>

<Card.Root id="ticketInfos">
    <Card.Header class="flex items-center justify-between">
        <Card.Title><span class="flex items-center gap-2">
            <Info size="18" />Informazioni Biglietto
        </span></Card.Title>
    </Card.Header>

    <Separator.Root />
    <Card.Content>
        <span class="w-full flex justify-between">
            <span>N° biglietto:</span>
            <span
                >{getFdPCode(ticket?.ticketId) ||
                    getFdPCode(ticketCode) ||
                    ""}</span
            >
        </span>
        <span class="text-black dark:text-white w-full flex justify-between">
            <span>Nominativo:</span>
            <span class="text-right"
                >{(ticket?.name || "") + " " + (ticket?.surname || "")}</span
            >
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
            <span class="{color} font-bold"
                >{ticket?.checkIn
                    ? new Date(ticket.checkIn).toLocaleString("it-IT", {
                          timeZone: "Europe/Rome",
                      })
                    : ""}</span
            >
        </span>
    </Card.Content>
</Card.Root>
