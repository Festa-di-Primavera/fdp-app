import { ORDERS } from "$lib/firebase/collections.js";
import { hasAnyPermissions } from "$lib/utils/permissions";
import type { Order } from "$models/order.js";
import { UserPermissions } from "$models/permissions";
import { getDocs, query, Timestamp, where } from "firebase/firestore";

export async function GET({ locals, params }) {
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

    if (!hasAnyPermissions(locals.user.permissions, UserPermissions.CASSA)) {
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

    const ticketId = decodeURIComponent(params.ticketId);
    const q = query(
        ORDERS,
        where("ticketId", "==", ticketId),
        where("done", "==", null)
    );
    const orders = await getDocs(q);

    if (orders.empty) {
        return new Response(JSON.stringify({ message: "Ordine non trovato" }), {
            status: 404,
            headers: {
                "Content-Type": "text/plain",
            },
        });
    }

    let resultOrders: Order[] = orders.docs.map((orderDoc) => {
        return {
            ticketId: orderDoc.data().ticketId,
            name: orderDoc.data().name,
            surname: orderDoc.data().surname,
            email: orderDoc.data().email,
            items: orderDoc.data().items,
            done: orderDoc.data().done,
            creationDate: (orderDoc.data().creationDate as Timestamp).toDate(),
            closeDate: orderDoc.data().closeDate ? (orderDoc.data().closeDate as Timestamp).toDate() : undefined,
            firebaseId: orderDoc.id,
        };
    });

    return new Response(JSON.stringify({ orders: resultOrders }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
