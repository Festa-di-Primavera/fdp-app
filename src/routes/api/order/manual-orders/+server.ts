import { getStringFromEnumValue } from "$lib/utils/enums";
import { sendEmail } from "$lib/utils/resend";
import { ItemType, type Order } from "$models/order";
import { ID_ENCRYPTION_KEY } from "$env/static/private";
import CryptoJS from "crypto-js";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { ORDERS } from "$lib/firebase/collections";

function getIngredientsList(type: ItemType): string {
    switch (type) {
        case ItemType.ONTO:
            return "Pane, hamburger, formaggio, cipolla, peperoni, insalata";
        case ItemType.VEGETARIANO:
            return "Pane, formaggio, cipolla, peperoni, insalata";
        case ItemType.BASIC:
            return "Pane, hamburger, formaggio";
        default:
            return "ERRORE NEL RECUPERO DEGLI INGREDIENTI";
    }
}

export async function POST({ request }) {
    const body = await request.json();
    const { name, surname, email, orderId, order } = body;

    const capName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    const capSurname =
        surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();

    let castedOrder: Order = order;

    const encryptedOrderId = CryptoJS.AES.encrypt(orderId, ID_ENCRYPTION_KEY).toString();

    const personalURL = `https://festa-cus.it/order/${encodeURIComponent(encryptedOrderId)}`;

    const htmlContent = `
		<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2d3748; background-color: #ffffff;">
			<h2 style="color: #3182ce; margin-bottom: 28px; font-size: 24px; font-weight: 600;">Ordine Panino - Festa di Primavera</h2>
			<p style="font-size: 16px; line-height: 1.6;">Ciao ${capName} ${capSurname},</p>

			<p style="font-size: 16px; line-height: 1.6;">ti confermiamo l'ordine per la <b>Festa di Primavera.</b></p>
			
			<div style="background-color: #f7fafc; padding: 24px; border-radius: 16px; margin: 28px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
				<h3 style="margin: 0 0 20px 0; color: #3182ce; font-size: 20px;">Riepilogo Ordine</h3>
				<ul style="list-style-type: none; padding-left: 0; margin: 0;">
					<li style="padding: 20px; background-color: white; border-radius: 12px; border: 1px solid #e2e8f0; transition: all 0.2s;">
						<div style="display: flex; margin-bottom: 12px; align-items: center;">
							<span style="font-size: 15px; margin-right: 12px;">🍔</span>
							<strong style="font-size: 18px; color: #2d3748; height: max-content;">Panino ${getStringFromEnumValue(
                                ItemType,
                                castedOrder.items[0].type
                            )}</strong>
							${
                                castedOrder.items[0].glutenFree
                                    ? '<span style="background-color: #c6f6d5; color: #276749; padding: 6px 12px; border-radius: 6px; font-size: 14px; margin-left: 12px; font-weight: 500;">SENZA GLUTINE</span>'
                                    : ""
                            }
						</div>
						<div style="font-size: 15px; color: #4a5568; margin: 12px 0; line-height: 1.5;">
							<strong>Ingredienti:</strong> ${getIngredientsList(castedOrder.items[0].type)}
						</div>
						${
                            castedOrder.items[0].removedIngredients?.length
                                ? `
							<div style="font-size: 15px; color: #f56565; margin: 12px 0; line-height: 1.5;">
								<strong>Rimozioni:</strong> ${castedOrder.items[0].removedIngredients.join(
                                    ", "
                                )}
							</div>
						`
                                : ""
                        }
					</li>
				</ul>
			</div>

			<p style="font-size: 16px; line-height: 1.6;">Se l'ordine non è corretto, contattaci immediatamente all'indirizzo 
				<a href="mailto:amerlo@sdbtrento.it" style="color: #3182ce; text-decoration: none; font-weight: 500; border-bottom: 1px solid #3182ce;">amerlo@sdbtrento.it</a>
			</p>

			<div style="margin-top: 28px; background-color: #f7fafc; padding: 20px; border-radius: 8px;">
				<p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
					<strong>Come utilizzare il pulsante:</strong><br>
					Quando sei pronto per mangiare, clicca il pulsante qui sotto per inviare l'ordine alla cucina. Il tuo ordine verrà aggiunto alla coda di preparazione. Dopo l'invio, ricordati di metterti in fila insieme agli altri.
				</p>
			</div>

			<div style="text-align: center; margin-top: 28px;">
				<a href="${personalURL}" style="display: inline-block; background-color: #48bb78; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 16px;">Invia l'ordine in cucina</a>
			</div>

			<p style="font-size: 16px; line-height: 1.6; margin-top: 28px;">A presto!😉</p>
			<p style="font-size: 16px; line-height: 1.6;">Lo staff della Festa di Primavera</p>
		</div>
	`;

    const emailResult = await sendEmail(
        email,
        "Ordine Panino - Festa di Primavera",
        htmlContent
    );

    if (emailResult.error) {
        return new Response(
            JSON.stringify({
                success: false,
                message: emailResult.message,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    return new Response(
        JSON.stringify({
            success: true,
            message: "Order processed and email sent successfully",
            emailId: emailResult.data?.id,
        }),
        {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }
    );
}

export async function PATCH({ request, locals }) {
    const { orderId, done, items, creationDate, closeDate } =
        await request.json();

    try {
        const orderRef = doc(ORDERS, orderId);
        const updateData: {
            done?: boolean | null;
            items?: any[];
            creationDate?: Timestamp;
            closeDate?: Timestamp;
        } = {};

        if (typeof done === "boolean") {
            updateData.done = done;
        }

        if (items) {
            updateData.items = items;
        }

        if (creationDate) {
            updateData.creationDate = Timestamp.fromDate(
                new Date(creationDate)
            );
        }

        if (closeDate) {
            updateData.closeDate = Timestamp.fromDate(new Date(closeDate));
        }

        if (Object.keys(updateData).length === 0) {
            return new Response(
                JSON.stringify({ message: "Parametri non validi" }),
                { status: 400 }
            );
        }

        await updateDoc(orderRef, updateData);

        return new Response(JSON.stringify({ message: "Ordine aggiornato!" }), {
            status: 200,
        });
    } catch (error) {
        console.error("Error updating order:", error);
        return new Response(
            JSON.stringify({
                message: "Errore nell'aggiornamento dell'ordine",
            }),
            { status: 500 }
        );
    }
}