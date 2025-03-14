import {
    addPermission,
    hasPermission,
    removePermission,
} from "$lib/utils/permissions";

import type { User } from "$lib/auth/user";
import { USERS } from "$lib/firebase/collections.js";
import { UserPermissions } from "$models/permissions";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function PUT({ params, locals, request }) {
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

    if (!hasPermission(locals.user.permissions, UserPermissions.UTENTI)) {
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

    const add = (await request.json()).add;

    try {
        const userDoc = doc(USERS, params.id);
        const currentUser = (await getDoc(userDoc)).data() as User;
        const permission = parseInt(params.newPermission, 10);

        await updateDoc(userDoc, {
            permissions: add
                ? addPermission(currentUser.permissions, permission)
                : removePermission(currentUser.permissions, permission),
        });

        const resp = new Response(
            JSON.stringify({
                message: `Permesso ${add ? "aggiunto" : "rimosso"}`,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );

        return resp;
    } catch (e) {
        const message = "Errore sconosciuto";

        const resp = new Response(JSON.stringify({ message: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });

        return resp;
    }
}
