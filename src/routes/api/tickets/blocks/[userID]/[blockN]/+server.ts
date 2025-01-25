import { getClientDB } from "$lib/firebase/client";
import { hasPermission } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { collection, doc, setDoc } from "firebase/firestore";

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
    const userID =
        params.userID === "undefined"
            ? null
            : decodeURIComponent(params.userID);
    const blockN = decodeURIComponent(params.blockN);

    const blocksCollection = collection(getClientDB(), "blocks");
    const blockDoc = doc(blocksCollection, blockN);
    await setDoc(
        blockDoc,
        userID
            ? {
                  assigned_to: userID,
                  assigned_by: locals.user.id,
                  assigned_at: new Date(),
              }
            : {
                  assigned_to: null,
                  assigned_by: locals.user.id,
                  assigned_at: new Date(),
              }
    );

    return new Response(
        JSON.stringify({
            message: userID ? "Blocchetto assegnato" : "Blocchetto rimosso",
        }),
        {
            // 200 OK
            status: 200,
            headers: {
                "content-type": "application/json",
            },
        }
    );
}
