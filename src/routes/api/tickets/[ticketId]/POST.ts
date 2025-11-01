import type { User } from "$lib/auth/user";
import { TICKETS, USERS } from "$lib/firebase/collections.js";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { getFdPOrStaffCode } from "$lib/utils/tickets";
import { UserPermissions } from "$models/permissions";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import type { RouteParams } from "./$types";

export async function handleRequest(
    params: RouteParams,
    request: Request,
    locals: App.Locals
) {
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
