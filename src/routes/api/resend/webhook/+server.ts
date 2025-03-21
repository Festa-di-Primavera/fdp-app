import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Ottieni il payload del webhook da Resend
        const webhookData = await request.json();

        // Definisci i tipi di evento email da gestire (escludendo 'email.sent')
        const emailEventTypes = [
            "email.delivered",
            "email.delivery_delayed",
            "email.complained",
            "email.bounced",
        ];

        // Verifica se il tipo di evento è tra quelli da gestire
        if (emailEventTypes.includes(webhookData.type)) {
            // Estrai i dati dall'evento
            const { type, created_at, data } = webhookData;
            const { to, bounce } = data;

            // Prepara il contenuto del messaggio per ntfy.sh
            let messageContent = `Tipo Evento: ${type
                .replace("email.", "")
                .replace("_", " ")
                .toUpperCase()}\n`;
            messageContent += `Data Creazione: ${new Date(
                created_at
            ).toLocaleString()}\n`;
            messageContent += `Destinatari: ${
                Array.isArray(to) ? to.join(", ") : to
            }\n`;

            // Aggiungi dettagli specifici in base al tipo di evento
            if (bounce) {
                messageContent += `Motivo Rimbalzo: ${bounce.message}\n`;
                messageContent += `Tipo Rimbalzo: ${bounce.type}\n`;
            }

			let tag = "email";	
			if (type === "email.complained") {
				tag = "no_entry";
			} else if (type === "email.bounced") {
				tag = "rotating_light";
			}
			else if (type === "email.delivery_delayed") {
				tag = "hourglass_flowing_sand";
			}

            // Invia la notifica a ntfy.sh
            await fetch("https://ntfy.sh/fdp-app-emails", {
                method: "POST",
                body: messageContent,
                headers: {
                    Title: `Email: ${type
                        .replace("email.", "")
                        .replace("_", " ")
                        .toUpperCase()}`,
                    Priority: "default",
                    Tags: "email",
                    "Content-Type": "text/plain",
                },
            });
        }
		else{
			// fetch with json content
			await fetch("https://ntfy.sh/fdp-app-emails", {
				method: "POST",
				body: JSON.stringify(webhookData),
				headers: {
					Title: `Email: ${webhookData.type}`,
					Priority: "default",
					Tags: "email",
					"Content-Type": "application/json",
				},
			});
		}

        // Restituisci una risposta di successo
        return json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Errore nel webhook:", error);
        return json({ error: "Elaborazione webhook fallita" }, { status: 500 });
    }
};
