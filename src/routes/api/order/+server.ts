import { getClientDB } from "$lib/firebase/client";
import { hasPermission } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { doc, setDoc } from "firebase/firestore";
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
