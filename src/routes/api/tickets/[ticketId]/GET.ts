import type { User } from "$lib/auth/user";
import { TICKETS, USERS } from "$lib/firebase/collections";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { getFdPOrStaffCode } from "$lib/utils/tickets";
import { UserPermissions } from "$models/permissions";
import type { Ticket } from "$models/ticket";
import { doc, getDoc } from "firebase/firestore";
import type { RouteParams } from "./$types";

export async function handleRequest(params: RouteParams, locals: App.Locals) {
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
        !hasAnyPermissions(locals.user.permissions, [
            UserPermissions.INFO_BIGLIETTO,
            UserPermissions.CASSA,
        ])
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

    const code = getFdPOrStaffCode(params.ticketId);
    if (code === null) {
        return new Response(JSON.stringify({ message: "Codice non valido" }), {
            status: 404,
            headers: {
                "content-type": "application/json",
            },
        });
    }

    const ticketDoc = await getDoc(doc(TICKETS, code));

    if (!ticketDoc.exists()) {
        return new Response(
            JSON.stringify({ message: "Biglietto non esistente" }),
            {
                status: 404,
                headers: {
                    "content-type": "application/json",
                },
            }
        );
    }

    const ticketData = ticketDoc.data();
    let ticket: Ticket;

    if (ticketData?.seller === null) {
        ticket = {
            ticketId: ticketDoc.id,
            name: ticketData?.name,
            surname: ticketData?.surname,
            seller: null,
            soldAt: ticketData?.soldAt?.toDate() || null,
            checkIn: ticketData?.checkIn?.toDate() || null,
        };
    } else {
        //* GET DEL NOME DEL VENDITORE
        const qUser = doc(USERS, ticketData.seller);
        const seller = (await getDoc(qUser)).data() as User;
        const sellerName = seller?.alias;

        ticket = {
            ticketId: ticketDoc.id,
            name: ticketData.name,
            surname: ticketData.surname,
            seller: sellerName ?? null,
            soldAt: ticketData.soldAt?.toDate() || null,
            checkIn: ticketData.checkIn?.toDate() || null,
        };
    }

    if (!ticketData.soldAt) {
        return new Response(JSON.stringify({ ticket }), {
            // 402 Payment Required (non venduto)
            status: 402,
            headers: {
                "content-type": "application/json",
            },
        });
    }

    if (!ticketData.checkIn) {
        return new Response(JSON.stringify({ ticket }), {
            status: 425, // Too Early instead of 403
            headers: {
                "content-type": "application/json",
            },
        });
    }

    return new Response(
        JSON.stringify({ ticket, message: "Biglietto validato" }),
        {
            // 206 Partial Content || 200 OK
            status: ticket.seller === null ? 206 : 200,
            headers: {
                "content-type": "application/json",
            },
        }
    );
}
