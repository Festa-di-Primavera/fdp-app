<script lang="ts">
    import type { Ticket } from "$models/ticket";
    import type { Order } from "$models/order";
    import moment from "moment-timezone";
    import { Button } from "$lib/components/ui/button";

    interface Props {
        tickets?: Ticket[];
        orders?: Order[];
    }

    let { tickets = $bindable([]), orders }: Props = $props();

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

    function downloadOrdersCSV() {
        if (!orders) {
            return;
        }

        const header = [
            "TicketID",
            "XNRF",
            "Done",
            "Name",
            "Surname",
            "CreatedAt",
            "ClosedAt",
            "Items",
        ];

        const data = orders.map((order) => [
            order.ticketId,
            order.fiscalMatrixNumber,
            order.done,
            order.name,
            order.surname,
            order.creationDate
                ? new Date(order.creationDate.seconds * 1000)
                : null,
            order.closeDate ? new Date(order.closeDate.seconds * 1000) : null,
            "??",
            // JSON.stringify(order.items),
        ]);

        const rows = [header, ...data];

        let csvContent = "data:text/csv;charset=utf-8,";
        rows.forEach((rowArray) => {
            csvContent += rowArray.join(",") + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ordersFDP.csv");
        // document.body.appendChild(link);

        link.click();
    }
</script>

<div
    class="m-auto flex w-full max-w-sm flex-row items-center justify-end md:max-w-3xl xl:max-w-6xl 2xl:max-w-396"
>
    <Button onclick={downloadCSV}>Export to CSV</Button>
</div>

<div
    class="m-auto flex w-full max-w-sm flex-row items-center justify-end md:max-w-3xl xl:max-w-6xl 2xl:max-w-396"
>
    <Button onclick={downloadOrdersCSV}>Export orders</Button>
</div>
