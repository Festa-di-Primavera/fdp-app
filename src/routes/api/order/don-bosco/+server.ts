import { getStringFromEnumValue } from "$lib/utils/enums";
import { sendEmail } from "$lib/utils/resend";
import { ItemType, Sauce, type Order } from "$models/order";
import QRCode from "qrcode";

export async function POST({ request }) {
    const body = await request.json();
    const { name, surname, email, order } = body;

    const capName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    const capSurname = surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();
    let trimmedTicketId = order.ticketId.replace("XNRF", "");
    trimmedTicketId = trimmedTicketId.replace("/25", "");

    let castedOrder: Order = order;
    let data = await QRCode.toBuffer(castedOrder.ticketId, {
        type: "png",
        width: 500,
    });

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #1a73e8;">Conferma Prenotazione</h2>
            <p style="font-size: 16px;">Ciao ${capName} ${capSurname},</p>
            <p style="font-size: 16px;">ti confermiamo la tua prenotazione per la serata condivisa della <b>Festa di Don Bosco.</b></p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="font-size: 16px; margin-bottom: 10px;">Il tuo ordine:</p>
                <ul style="list-style-type: none; padding-left: 0;">
                    <li style="padding: 10px; background-color: white; border-radius: 4px;">
                        🍔 Panino ${getStringFromEnumValue(ItemType, castedOrder.items[0].type)}
                        ${castedOrder.items[0].glutenFree ? '<span style="background-color: #e8f5e9; color: #2e7d32; padding: 2px 6px; border-radius: 4px; font-size: 14px;">SENZA GLUTINE</span>' : ''}
                        ${castedOrder.items[0].sauce ? `<br>🥫 Salsa: ${getStringFromEnumValue(Sauce, castedOrder.items[0].sauce!!)}` : ''}
                    </li>
                </ul>
            </div>

            <p style="font-size: 16px;">Se l'ordine non è corretto, scrivi a <a href="mailto:amerlo@sdbtrento.it" style="color: #1a73e8; text-decoration: none;">amerlo@sdbtrento.it</a> il prima possibile.</p>

            <p style="font-size: 16px; margin-top: 20px;">In allegato trovi il codice QR che ti servirà per ritirare il panino.</p>

            <p style="font-size: 16px;">A presto!</p>
        </div>
    `;

    await sendEmail(
        email,
        "Serata condivisa - Festa di Don Bosco",
        htmlContent,
        [{ filename: `${capName}_${capSurname}_${trimmedTicketId}.png`, content: data }]
    );

    return new Response("", {
        status: 200,
    });
}
