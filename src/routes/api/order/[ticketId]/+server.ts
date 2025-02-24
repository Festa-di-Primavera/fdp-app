import { getClientDB } from "$lib/firebase/client";
import { hasPermission } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { collection, getDocs, query, where } from "firebase/firestore";

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

    if (!hasPermission(locals.user.permissions, UserPermissions.CASSA)) {
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
        collection(getClientDB(), "orders"),
        where("ticketId", "==", ticketId),
        where("done", "==", null)
    );
    const orders = await getDocs(q);
    const orderDoc = orders.docs[0];

    if (!orderDoc || !orderDoc.exists()) {
        return new Response(JSON.stringify({ message: "Ordine non trovato" }), {
            status: 404,
            headers: {
                "Content-Type": "text/plain",
            },
        });
    }

    let order = {
        ticketId: orderDoc.data().ticketId,
        name: orderDoc.data().name,
        items: orderDoc.data().items,
        done: orderDoc.data().done,
        timestamp: orderDoc.data().timestamp,
        id: orderDoc.id,
    };

    return new Response(JSON.stringify({ order }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
