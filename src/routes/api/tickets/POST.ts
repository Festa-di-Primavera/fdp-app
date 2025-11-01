import { TICKETS } from "$lib/firebase/collections.js";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { doc, setDoc } from "firebase/firestore";

export async function handleRequest(request: Request, locals: App.Locals) {
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

    if (
        !hasAnyPermissions(locals.user.permissions, UserPermissions.GENERAZIONE)
    ) {
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

    const body = await request.json();
    for (const code of body.codes) {
        const ticketRef = doc(TICKETS, code);
        await setDoc(ticketRef, {
            name: null,
            surname: null,
            seller: null,
            soldAt: null,
            checkIn: null,
        });
    }

    return new Response(null, {
        status: 204,
    });
}
