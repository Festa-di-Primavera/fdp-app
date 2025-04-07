import { getClientDB } from "$lib/firebase/client.js";
import { BLOCKS, TICKETS } from "$lib/firebase/collections.js";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import {
    doc,
    getCountFromServer,
    getDocs,
    query,
    setDoc,
    writeBatch,
} from "firebase/firestore";

// TODO: Migliorare la generazione in base ai biglietti già presenti nel database
export async function POST({ locals, request }) {
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

    if (!hasAnyPermissions(locals.user.permissions, UserPermissions.GENERAZIONE)) {
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

    if (body.ticketsNumber % body.ticketsPerBlock !== 0) {
        return new Response(
            JSON.stringify({
                message: `${body.ticketsNumber} non è multiplo di ${body.ticketsPerBlock}`,
            }),
            {
                status: 400,
                headers: { "content-type": "application/json" },
            }
        );
    }

    try {
        const ticketsCount = (await getCountFromServer(TICKETS)).data().count;
        if (ticketsCount != body.ticketsNumber) {
            return new Response(
                JSON.stringify({
                    message: "Il numero di biglietti non corrisponde",
                }),
                {
                    // 400 Bad Request
                    status: 400,
                    headers: {
                        "content-type": "application/json",
                    },
                }
            );
        }

        const blocksToGenerate = body.ticketsNumber / body.ticketsPerBlock;

        // Cancella i blocchi esistenti prima di crearne di nuovi
        const existingBlocksQuery = query(BLOCKS);
        const existingBlocksSnapshot = await getDocs(existingBlocksQuery);
        const batch = writeBatch(getClientDB());
        existingBlocksSnapshot.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        const START = body.startCode;
        // Genera i nuovi blocchi
        for (let i = 0; i < blocksToGenerate; i++) {
            const matrix = START + i * body.ticketsPerBlock;
            const blockId = "XNRF " + matrix.toString().padStart(5, "0");
            // Inserisci il nuovo blocco nella collezione "blocks"
            await setDoc(doc(BLOCKS, blockId), {
                assigned_at: null,
                assigned_by: null,
                assigned_to: null,
            });
        }

        return new Response(
            JSON.stringify({ message: "Blocchetti generati con successo" }),
            {
                status: 200,
                headers: { "content-type": "application/json" },
            }
        );
    } catch (e) {
        console.log(e);
        return new Response(JSON.stringify({ error: (e as Error).message }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
}
