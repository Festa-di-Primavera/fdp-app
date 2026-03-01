import { ItemType, type Order } from "$models/order";
import { COLORS } from "../colors";
import { getStringFromEnumValue } from "../enums";

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

export async function staffOrderTemplate(order: Order): Promise<string> {
    return `
	<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 16px; color: #2d3748; background-color: #ffffff;">
            <div style="text-align: center; background-color: ${COLORS.headerBg}; padding: 10px 0; border-radius: 10px;">
                <img src="cid:logo" alt="fdp-logo" border="0" height="80rem">
            </div>
            <p style="font-size: 16px; line-height: 1.5;">Ciao ${order.name} ${
        order.surname
    }</p>
            <p style="font-size: 16px; line-height: 1.5;"><b>In allegato</b> alla mail trovi il QR code per riscattare il tuo ordine.</p>

            <div style="background-color: ${COLORS.lightBg}; padding: 16px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h3 style="margin: 0 0 16px 0; color: ${COLORS.textDark}; font-size: 18px;">Riepilogo Ordine</h3>
                <div style="padding: 16px; background-color: white; border-radius: 12px; border: 1px solid ${COLORS.lightBorder};">
                    <div style="margin-bottom: 12px;">
                        <span style="font-size: 15px; margin-right: 8px;">🍔</span>
                        <strong style="font-size: 16px; color: #2d3748; display: inline-block;">Panino ${getStringFromEnumValue(
                            ItemType,
                            order.items[0].type
                        )}</strong>
                    </div>
                    ${
                        order.items[0].glutenFree
                            ? `<div style="margin: 8px 0;"><span style="background-color: ${COLORS.badgeBg}; color: ${COLORS.textDark}; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 500;">SENZA GLUTINE</span></div>`
                            : ""
                    }
                    <div style="font-size: 14px; color: #4a5568; margin: 8px 0;">
                        <strong>Ingredienti:</strong> ${getIngredientsList(
                            order.items[0].type
                        )}
                    </div>
                    ${
                        order.items[0].removedIngredients?.length
                            ? `<div style="font-size: 14px; color: #f56565; margin: 8px 0;">
                                <strong>Rimozioni:</strong> ${order.items[0].removedIngredients.join(
                                    ", "
                                )}
                            </div>`
                            : ""
                    }
                </div>
            </div>
            <p style="font-size: 14px; margin-top: 20px;">A presto!😉<br>Lo staff della Festa di Primavera</p>
        </div>`;
}
