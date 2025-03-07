import type { User } from "$lib/auth/user";
import { getClientDB } from "$lib/firebase/client.js";
import { hasPermission } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import type { Ticket } from "$models/ticket";
import { json } from "@sveltejs/kit";
import {
    collection,
    doc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";

export async function GET({ locals }) {
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
        !hasPermission(locals.user.permissions, UserPermissions.LISTA_BIGLIETTI)
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

    const ticketsCollection = collection(getClientDB(), "tickets");
    const qTickets = query(ticketsCollection);
    const qSnapTickets = await getDocs(qTickets);

    //get sellers
    const usersCollection = collection(getClientDB(), "users");
    const qUsers = query(
        usersCollection,
        where("permissions", ">=", UserPermissions.VENDITA)
    );
    const qSnapUsers = await getDocs(qUsers);

    const sellers = (
        qSnapUsers.docs.map((userDoc) => {
            return userDoc.data();
        }) as User[]
    ).filter((user) =>
        hasPermission(user.permissions, UserPermissions.VENDITA)
    );

    const tickets: Ticket[] = qSnapTickets.docs.map((ticketDoc) => {
        return {
            ticketId: ticketDoc.id,
            name: ticketDoc.data().name,
            surname: ticketDoc.data().surname,
            seller:
                sellers.find(
                    (seller: User) => seller.id === ticketDoc.data().seller
                )?.alias ?? null,
            soldAt: ticketDoc.data().soldAt?.toDate(),
            checkIn: ticketDoc.data().checkIn?.toDate(),
        };
    });

    return json({
        status: 200,
        body: {
            tickets,
        },
    });
}

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

    if (!hasPermission(locals.user.permissions, UserPermissions.GENERAZIONE)) {
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
        const ticketRef = doc(getClientDB(), "tickets", code);
        await setDoc(ticketRef, {
            name: null,
            surname: null,
            seller: null,
            soldAt: null,
            checkIn: null,
        });
    }

    return json({
        status: 200, // TODO: check if all tickets were added
    });
}

export async function PUT({ request, locals }) {
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
        !hasPermission(locals.user.permissions, UserPermissions.LISTA_BIGLIETTI)
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

    const ticketsCollection = collection(getClientDB(), "tickets");
    await updateDoc(doc(ticketsCollection, body.ticketId), attrs);

    return new Response("", {
        status: 200,
    });
}
