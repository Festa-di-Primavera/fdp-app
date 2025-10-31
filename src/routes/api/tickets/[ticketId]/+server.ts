import type { User } from "$lib/auth/user";
import { TICKETS, USERS } from "$lib/firebase/collections.js";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { getFdPOrStaffCode } from "$lib/utils/tickets";
import { UserPermissions } from "$models/permissions";
import type { Ticket } from "$models/ticket";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";

export async function GET({ params, locals }) {
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

export async function PUT({ params, locals }) {
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

    if (!hasAnyPermissions(locals.user.permissions, UserPermissions.CHECK_IN)) {
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
            // 404 Not Found
            status: 404,
            headers: {
                "content-type": "application/json",
            },
        });
    }

    const ticketDocRef = doc(TICKETS, code);

    const ticketDoc = await getDoc(ticketDocRef);

    //* BIGLIETTO NON ESISTENTE
    if (!ticketDoc.exists()) {
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
    await updateDoc(doc(TICKETS, code), {
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

export async function POST({ params, request, locals }) {
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

    if (!hasAnyPermissions(locals.user.permissions, UserPermissions.VENDITA)) {
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

    const formData = await request.json();
    const code = getFdPOrStaffCode(params.ticketId);

    if (code === null) {
        const response = new Response(
            JSON.stringify({ message: "Codice non valido" }),
            {
                status: 404,
                headers: {
                    "content-type": "application/json",
                },
            }
        );

        return response;
    }

    const name = formData.name;
    const surname = formData.surname;
    const seller = formData.seller;
    const soldAt = Timestamp.fromDate(new Date());

    const ticket = await getDoc(doc(TICKETS, code));

    if (!ticket.exists()) {
        const response = new Response(
            JSON.stringify({ message: "Biglietto non esistente" }),
            {
                status: 404,
                headers: {
                    "content-type": "application/json",
                },
            }
        );

        return response;
    }

    if (ticket.data().soldAt) {
        const response = new Response(
            JSON.stringify({ message: "Biglietto già venduto" }),
            {
                status: 403,
                headers: {
                    "content-type": "application/json",
                },
            }
        );

        return response;
    }

    try {
        await setDoc(doc(TICKETS, `${code}`), {
            name: name,
            surname: surname,
            checkIn: null,
            soldAt: soldAt,
            seller: seller,
        });

        //* AGGIORNAMENTO SOLDI DEL VENDITORE
        const userDoc = doc(USERS, seller);
        const user = (await getDoc(userDoc)).data() as User;
        const userMoney = user.owned_money + 10;
        const totMoney = user.total_from_sales + 10;
        await updateDoc(userDoc, {
            owned_money: userMoney,
            total_from_sales: totMoney,
        });

        const response = new Response(
            JSON.stringify({ message: "Biglietto venduto" }),
            {
                status: 200,
                headers: {
                    "content-type": "application/json",
                },
            }
        );

        return response;
    } catch (e) {
        const response = new Response(
            JSON.stringify({ message: "Errore nella vendita" }),
            {
                status: 500,
                headers: {
                    "content-type": "application/json",
                },
            }
        );

        return response;
    }
}
