import { getStringFromEnumValue } from "$lib/utils/enums";
import { sendEmail } from "$lib/utils/resend";
import { generateTicketImage } from "$lib/utils/imageGenerator";
import { ItemType, Sauce, type Order } from "$models/order";

function getIngredientsList(type: ItemType): string {
    switch(type) {
        case ItemType.VEGETARIANO:
            return "Pane, formaggio, peperoni, cipolla, insalata";
        case ItemType.ONTO:
            return "Pane, hamburger, cipolla, peperoni, insalata";
        case ItemType.BASIC:
            return "Pane, hamburger";
        default:
            return "";
    }
}

export async function POST({ request }) {
    const body = await request.json();
    const { name, surname, email, order } = body;

    const capName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    const capSurname = surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();
    let trimmedTicketId = order.ticketId.replace("XNRF", "");
    trimmedTicketId = trimmedTicketId.replace("/25", "");

    let castedOrder: Order = order;
    const qrImage = await generateTicketImage(capName, capSurname, castedOrder.ticketId);

    const htmlContent = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2d3748; background-color: #ffffff;">
            <h2 style="color: #3182ce; margin-bottom: 28px; font-size: 24px; font-weight: 600;">Conferma Prenotazione - Festa di Don Bosco</h2>
            <p style="font-size: 16px; line-height: 1.6;">Ciao ${capName} ${capSurname},</p>
            <p style="font-size: 16px; line-height: 1.6;">ti confermiamo la tua prenotazione per la serata condivisa della <b>Festa di Don Bosco.</b></p>
            
            <div style="background-color: #f7fafc; padding: 24px; border-radius: 16px; margin: 28px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h3 style="margin: 0 0 20px 0; color: #3182ce; font-size: 20px;">Riepilogo Ordine</h3>
                <ul style="list-style-type: none; padding-left: 0; margin: 0;">
                    <li style="padding: 20px; background-color: white; border-radius: 12px; border: 1px solid #e2e8f0; transition: all 0.2s;">
                        <div style="display: flex; margin-bottom: 12px; align-items: center;">
                            <span style="font-size: 15px; margin-right: 12px;">🍔</span>
                            <strong style="font-size: 18px; color: #2d3748; height: max-content;">Panino ${getStringFromEnumValue(ItemType, castedOrder.items[0].type)}</strong>
                            ${castedOrder.items[0].glutenFree ? 
                                '<span style="background-color: #c6f6d5; color: #276749; padding: 6px 12px; border-radius: 6px; font-size: 14px; margin-left: 12px; font-weight: 500;">SENZA GLUTINE</span>' : 
                                ''}
                        </div>
                        <div style="font-size: 15px; color: #4a5568; margin: 12px 0; line-height: 1.5;">
                            <strong>Ingredienti:</strong> ${getIngredientsList(castedOrder.items[0].type)}
                        </div>
                        ${castedOrder.items[0].sauce ? 
                            `<div style="font-size: 15px; color: #4a5568; line-height: 1.5;">
                                <span style="font-size: 18px;">🥫</span> <strong>Salsa:</strong> ${getStringFromEnumValue(Sauce, castedOrder.items[0].sauce!!)}
                            </div>` : 
                            '<div style="font-size: 15px; color: #4a5568; line-height: 1.5;"><span style="font-size: 18px;">🥫</span> <strong>Salsa:</strong> Nessuna salsa</div>'}
                        ${castedOrder.items[0].notes ? 
                            `<div style="font-size: 15px; color: #4a5568; margin-top: 12px; line-height: 1.5;">
                                <span style="font-size: 18px;">📝</span> <strong>Note:</strong> ${castedOrder.items[0].notes}
                            </div>` : 
                            ''}
                    </li>
                </ul>
            </div>

            <p style="font-size: 16px; line-height: 1.6;">Se l'ordine non è corretto, contattaci immediatamente all'indirizzo 
                <a href="mailto:amerlo@sdbtrento.it" style="color: #3182ce; text-decoration: none; font-weight: 500; border-bottom: 1px solid #3182ce;">amerlo@sdbtrento.it</a>
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-top: 28px; padding: 16px; background-color: #ebf8ff; border-radius: 8px; color: #2c5282;">
                <strong>Importante:</strong> In allegato trovi il codice QR necessario per ritirare il tuo panino.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-top: 28px;">A presto!😉</p>
        </div>
    `;

    await sendEmail(
        email,
        "Serata condivisa - Festa di Don Bosco",
        htmlContent,
        [{ filename: `${capName}_${capSurname}_${trimmedTicketId}.png`, content: qrImage }],
        "Festa di Don Bosco"
    );

    return new Response("", {
        status: 200,
    });
}
