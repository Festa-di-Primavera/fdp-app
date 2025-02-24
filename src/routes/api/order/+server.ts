import { getClientDB } from "$lib/firebase/client";
import { hasPermission } from "$lib/utils/permissions";
import type { Order } from "$models/order.js";
import { UserPermissions } from "$models/permissions";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { v4 } from "uuid";

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

    if (!hasPermission(locals.user.permissions, UserPermissions.CUCINA)) {
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

    const order = await request.json() as Order;

    await setDoc(doc(getClientDB(), "orders", v4()), order)
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
        }),
        {
            status: 200,
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
        !hasPermission(locals.user.permissions, UserPermissions.CUCINA) &&
        !hasPermission(locals.user.permissions, UserPermissions.CASSA)
    ) {
        return new Response(
            JSON.stringify({ message: "Non hai i permessi necessari" }),
            { status: 403 }
        );
    }

    const { orderId, done, items, timestamp } = await request.json();

    try {
        const orderRef = doc(getClientDB(), "orders", orderId);
        const updateData: {
            done?: boolean;
            items?: any[];
            timestamp?: number;
        } = {};

        if (typeof done === "boolean") {
            updateData.done = done;
        }

        if (items) {
            updateData.items = items;
        }

        if (timestamp) {
            updateData.timestamp = timestamp;
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
