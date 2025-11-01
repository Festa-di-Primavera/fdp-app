// Endpoint adibito alla pulizia del database (sessioni scadute, token e codici di verifica scaduti)
// Aggiunta la variabile d'ambiente CRON_SECRET per l'autenticazione (su vercel, è un token generato randomicamente)

import { handleRequest } from './GET.js';

export async function GET({ request }) {
    return handleRequest(request);
}
