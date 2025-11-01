import { TICKETS } from "$lib/firebase/collections.js";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { doc, updateDoc } from "firebase/firestore";

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
        !hasAnyPermissions(
            locals.user.permissions,
            UserPermissions.LISTA_BIGLIETTI
        )
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

    const body: {
        attribute: string;
        toChange: "name" | "surname";
        ticketId: string;
    } = await request.json();

    let attrs;
    if (body.toChange == "name") {
        attrs = {
            name: body.attribute.toUpperCase(),
        };
    } else if (body.toChange == "surname") {
        attrs = {
            surname: body.attribute.toUpperCase(),
        };
    } else {
        attrs = {};
    }

    await updateDoc(doc(TICKETS, body.ticketId), attrs);

    return new Response("", {
        status: 200,
    });
}
