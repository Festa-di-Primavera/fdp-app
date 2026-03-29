import { TICKETS } from "$lib/firebase/collections.js";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { doc, setDoc } from "firebase/firestore";

export type TicketsGenerationRequestBody = {
    ticketId: string;
    fiscalMatrixNumber: string;
}[];

export async function handleRequest(request: Request, locals: App.Locals) {
    if (!locals.user) {
        return new Response(
            JSON.stringify({ message: "Non sei autenticato" }),
            {
                status: 401,
                headers: {
                    "Content-Type": "application/json",
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
                    "Content-Type": "application/json",
                },
            }
        );
    }

    const body: TicketsGenerationRequestBody = await request.json();
    for (const code of body) {
        const ticketRef = doc(TICKETS, code.ticketId);
        await setDoc(ticketRef, {
            ticketId: code.ticketId,
            fiscalMatrixNumber: code.fiscalMatrixNumber,
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
