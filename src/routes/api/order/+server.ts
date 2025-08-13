import { ORDERS } from "$lib/firebase/collections.js";
import { hasAnyPermissions } from "$lib/utils/permissions";
import type { Order } from "$models/order.js";
import { UserPermissions } from "$models/permissions";
import { doc, setDoc, Timestamp, updateDoc } from "firebase/firestore";

export async function POST({ request, locals }) {
    if (!locals.user) {
        return new Response(
            JSON.stringify({ message: "Non sei autenticato" }),
            {
                status: 401,
                headers: {
                    "Content-Type": "text/plain",
                },
            }
        );
    }

    if (!hasAnyPermissions(locals.user.permissions, [UserPermissions.CUCINA, UserPermissions.CASSA, UserPermissions.ORDINI])) {
        return new Response(
            JSON.stringify({ message: "Non hai i permessi necessari" }),
            {
                status: 403,
                headers: {
                    "Content-Type": "text/plain",
                },
            }
        );
    }

    const order = (await request.json()) as Order;

    const timestamp = new Date(order.creationDate)
        .toLocaleTimeString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
        .replace(/\//g, "-")
        .replace(" ", "");

    console.log(`${order.ticketId}-${timestamp}`);

    await setDoc(doc(ORDERS, `${order.ticketId}-${timestamp}`), {
        ...order,
        creationDate: Timestamp.fromDate(new Date(order.creationDate)),
    })
        .then(() => {
            console.log("Document successfully written for ", order.name);
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
            return new Response(
                JSON.stringify({ message: "Errore nell'invio dell'ordine" }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "text/plain",
                    },
                }
            );
        });

    return new Response(
        JSON.stringify({
            message: "Ordine inviato!",
            orderId: `${order.ticketId}-${timestamp}`,
        }),
        {
            status: 201,
            headers: {
                "Content-Type": "text/plain",
            },
        }
    );
}

export async function PATCH({ request, locals }) {
    if (!locals.user) {
        return new Response(
            JSON.stringify({ message: "Non sei autenticato" }),
            { status: 401 }
        );
    }

    if (
        !hasAnyPermissions(locals.user.permissions, [UserPermissions.CUCINA, UserPermissions.CASSA])
    ) {
        return new Response(
            JSON.stringify({ message: "Non hai i permessi necessari" }),
            { status: 403 }
        );
    }

    const { orderId, done, items, creationDate, closeDate } =
        await request.json();

    try {
        const orderRef = doc(ORDERS, orderId);
        const updateData: {
            done?: boolean | null;
            items?: any[];
            creationDate?: Timestamp;
            closeDate?: Timestamp;
        } = {};

        if (typeof done === "boolean") {
            updateData.done = done;
        }

        if (items) {
            updateData.items = items;
        }

        if (creationDate) {
            updateData.creationDate = Timestamp.fromDate(
                new Date(creationDate)
            );
        }

        if (closeDate) {
            updateData.closeDate = Timestamp.fromDate(new Date(closeDate));
        }

        if (Object.keys(updateData).length === 0) {
            return new Response(
                JSON.stringify({ message: "Parametri non validi" }),
                { status: 400 }
            );
        }

        await updateDoc(orderRef, updateData);

        return new Response(JSON.stringify({ message: "Ordine aggiornato!" }), {
            status: 200,
        });
    } catch (error) {
        console.error("Error updating order:", error);
        return new Response(
            JSON.stringify({
                message: "Errore nell'aggiornamento dell'ordine",
            }),
            { status: 500 }
        );
    }
}
