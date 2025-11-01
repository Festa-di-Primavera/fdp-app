import { ORDERS } from "$lib/firebase/collections";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { doc, Timestamp, updateDoc } from "firebase/firestore";

export async function handleRequest(request: Request, locals: App.Locals) {
    if (!locals.user) {
        return new Response(
            JSON.stringify({ message: "Non sei autenticato" }),
            { status: 401 }
        );
    }

    if (
        !hasAnyPermissions(locals.user.permissions, [
            UserPermissions.CUCINA,
            UserPermissions.CASSA,
        ])
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
