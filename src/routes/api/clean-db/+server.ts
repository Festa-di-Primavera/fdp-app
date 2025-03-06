// Endpoint adibito alla pulizia del database (sessioni scadute, token e codici di verifica scaduti)
// Aggiunta la variabile d'ambiente CRON_SECRET per l'autenticazione (su vercel, è un token generato randomicamente)

import { invalidateExpiredSessions } from "$lib/auth/session.js";
import { getClientDB } from "$lib/firebase/client";
import {
    EMAIL_VERIFICATION_CODES,
    PASSWORD_RESET_TOKENS,
} from "$lib/firebase/collections.js";
import {
    getDocs,
    query,
    Timestamp,
    where,
    writeBatch,
} from "firebase/firestore";

export async function GET({ request }) {
    // check if headers contain the secret
    if (
        request.headers.get("Authorization") !==
        `Bearer ${process.env.CRON_SECRET}`
    ) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    // Lucia - Eliminazione sessioni scadute
    invalidateExpiredSessions();

    // Eliminazione token di reset password scaduti
    const passwordTokensQuery = query(
        PASSWORD_RESET_TOKENS,
        where("expires_at", "<=", Timestamp.fromDate(new Date()))
    );
    const passwordTokensSnapshot = await getDocs(passwordTokensQuery);
    const pwTokBatch = writeBatch(getClientDB());
    passwordTokensSnapshot.forEach((doc) => pwTokBatch.delete(doc.ref));
    await pwTokBatch.commit();

    // Eliminazione codici di verifica scaduti
    const emailVerificationCodesQuery = query(
        EMAIL_VERIFICATION_CODES,
        where("expires_at", "<=", Timestamp.fromDate(new Date()))
    );
    const emailVerificationCodesSnapshot = await getDocs(
        emailVerificationCodesQuery
    );
    const emailBatch = writeBatch(getClientDB());
    emailVerificationCodesSnapshot.forEach((doc) => emailBatch.delete(doc.ref));
    await emailBatch.commit();

    return new Response(JSON.stringify({ message: "Database pulito" }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
