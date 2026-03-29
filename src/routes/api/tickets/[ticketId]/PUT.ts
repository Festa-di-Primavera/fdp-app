import { hasAnyPermissions } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { doc, getDoc, getDocs, or, query, Timestamp, updateDoc, where } from "firebase/firestore";
import type { RouteParams } from "./$types";
import { TICKETS, USERS } from "$lib/firebase/collections";
import type { Ticket } from "$models/ticket";
import type { User } from "$lib/auth/user";

export async function handleRequest(params: RouteParams, locals: App.Locals) {
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

    if (!hasAnyPermissions(locals.user.permissions, UserPermissions.CHECK_IN)) {
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
    const code = params.ticketId;

    if (code === null) {
        return new Response(JSON.stringify({ message: "Codice non valido" }), {
            // 404 Not Found
            status: 404,
            headers: {
                "content-type": "application/json",
            },
        });
    }

    const ticketQuery = query(TICKETS, or(where("ticketId", "==", code), where("fiscalMatrixNumber", "==", code)));
    const querySnapshot = await getDocs(ticketQuery);
    const ticketDoc = querySnapshot.docs[0];

    //* BIGLIETTO NON ESISTENTE
    if (!ticketDoc || !ticketDoc.exists()) {
        return new Response(
            JSON.stringify({ message: "Biglietto non valido" }),
            {
                // 404 Not Found
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
            fiscalMatrixNumber: ticketData?.fiscalMatrixNumber,
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
            fiscalMatrixNumber: ticketData.fiscalMatrixNumber,
            name: ticketData.name,
            surname: ticketData.surname,
            seller: sellerName ?? null,
            soldAt: ticketData.soldAt?.toDate() || null,
            checkIn: ticketData.checkIn?.toDate() || null,
        };
    }

    //* BIGLIETTO NON VENDUTO
    if (!ticket.soldAt) {
        return new Response(
            JSON.stringify({ ticket, message: "Biglietto non venduto" }),
            {
                // 402 Payment Required
                status: 402,
                headers: {
                    "content-type": "application/json",
                },
            }
        );
    }

    //* BIGLIETTO GIA' VALIDATO
    if (ticket.checkIn) {
        return new Response(
            JSON.stringify({ ticket, message: "Biglietto già validato" }),
            {
                // 409 Conflict
                status: 409,
                headers: {
                    "content-type": "application/json",
                },
            }
        );
    }

    //* BIGLIETTO NON ANCORA VALIDATO
    const currentTimestamp = Timestamp.fromDate(new Date());
    await updateDoc(doc(TICKETS, ticket.ticketId), {
        checkIn: currentTimestamp,
    });

    ticket.checkIn = currentTimestamp.toDate();

    return new Response(
        JSON.stringify({
            ticket,
            message: "Biglietto validato",
            second: false,
        }),
        {
            // 206 Partial Content || 200 OK
            status: ticket.name === null ? 206 : 200,
            headers: {
                "content-type": "application/json",
            },
        }
    );
}
