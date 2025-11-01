import type { User } from "$lib/auth/user";
import { TICKETS, USERS } from "$lib/firebase/collections.js";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import type { Ticket } from "$models/ticket";
import { json } from "@sveltejs/kit";
import { getDocs, query, where } from "firebase/firestore";

export async function handleRequest(locals: App.Locals) {
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

    const qTickets = query(TICKETS);
    const qSnapTickets = await getDocs(qTickets);

    //get sellers
    const qUsers = query(
        USERS,
        where("permissions", ">=", UserPermissions.VENDITA)
    );
    const qSnapUsers = await getDocs(qUsers);

    const sellers = (
        qSnapUsers.docs.map((userDoc) => {
            return userDoc.data();
        }) as User[]
    ).filter((user) =>
        hasAnyPermissions(user.permissions, UserPermissions.VENDITA)
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
