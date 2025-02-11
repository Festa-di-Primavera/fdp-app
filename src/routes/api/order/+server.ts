import { getClientDB } from "$lib/firebase/client";
import { hasPermission } from "$lib/utils/permissions";
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

    const order = await request.json();

    await setDoc(doc(getClientDB(), "orders", v4()), order);

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

    if (!hasPermission(locals.user.permissions, UserPermissions.CUCINA)) {
        return new Response(
            JSON.stringify({ message: "Non hai i permessi necessari" }),
            { status: 403 }
        );
    }

    const { orderId, done, items } = await request.json();
    
    try {
        const orderRef = doc(getClientDB(), "orders", orderId);

        if (typeof done === 'boolean') {
            // Updating order completion status
            await updateDoc(orderRef, { done });
        } else if (items) {
            // Updating the entire items array
            await updateDoc(orderRef, { items });
        } else {
            return new Response(
                JSON.stringify({ message: "Parametri non validi" }),
                { status: 400 }
            );
        }

        return new Response(
            JSON.stringify({ message: "Ordine aggiornato!" }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating order:', error);
        return new Response(
            JSON.stringify({ message: "Errore nell'aggiornamento dell'ordine" }),
            { status: 500 }
        );
    }
}
