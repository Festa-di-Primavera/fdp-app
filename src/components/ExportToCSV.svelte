<script lang="ts">
    import type { Ticket } from "$models/ticket";
    import { Button } from "flowbite-svelte";
    import moment from "moment-timezone";

    interface Props {
        tickets?: Ticket[];
    }

    let { tickets = $bindable([]) }: Props = $props();

    function downloadCSV() {
        const rows = [
            ["TicketID", "Name", "Surname", "CheckIn", "SoldAt", "Seller"],
            ...tickets.map((ticket) => [
                ticket.ticketId,
                ticket.name,
                ticket.surname,
                ticket.checkIn
                    ? moment.tz(ticket.checkIn, moment.tz.guess())
                    : null,
                ticket.soldAt
                    ? moment.tz(ticket.soldAt, moment.tz.guess())
                    : null,
                ticket.seller,
            ]),
        ];

        let csvContent = "data:text/csv;charset=utf-8,";
        rows.forEach((rowArray) => {
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ticketsFDP.csv");
        document.body.appendChild(link);

        link.click();
    }
</script>

<div
    class="m-auto flex w-full max-w-sm flex-row items-center justify-end md:max-w-3xl xl:max-w-6xl 2xl:max-w-[1584px]"
>
    <Button onclick={downloadCSV}>Export to CSV</Button>
</div>
