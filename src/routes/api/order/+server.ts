import { ORDERS, STAFF_TICKETS_INCREMENTAL } from "$lib/firebase/collections";
import { v4 as uuidv4 } from "uuid";
import { hasAnyPermissions } from "$lib/utils/permissions";
import type { Order } from "$models/order";
import { UserPermissions } from "$models/permissions";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { sendEmail } from "$lib/utils/resend";
import { staffOrderTemplate } from "$lib/utils/email-templates/staff-order";
import type { Attachment } from "resend";
import StaffOrderOG from "$lib/utils/email-templates/StaffOrderOG";
import { ImageResponse } from "@vercel/og";
import {
    generateQRCodeBase64,
    getLogoBase64,
} from "$lib/utils/imageGenerator.js";

export async function POST({ request, locals }) {
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

    if (
        !hasAnyPermissions(locals.user.permissions, [
            UserPermissions.CUCINA,
            UserPermissions.CASSA,
            UserPermissions.ORDINI,
        ])
    ) {
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

    const req = await request.json();

    let order: Order = req.order;
    const shouldSendEmail: boolean = req.shouldSendEmail ?? false;

    if (shouldSendEmail) {
        order.name = order.name.toUpperCase();
        order.surname = order.surname.toUpperCase();

        order.ticketId = await getStaffTicketId();
    }

    const orderUUID = uuidv4();

    await setDoc(doc(ORDERS, orderUUID), {
        ...order,
        creationDate: Timestamp.fromDate(new Date(order.creationDate)),
    })
        .then(() => {
            console.log("Document successfully written for ", order.name);
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
            return new Response(
                JSON.stringify({ message: "Errore nell'invio dell'ordine" }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "text/plain",
                    },
                }
            );
        });

    if (shouldSendEmail) {
        if (!order.email) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "L'ordine non ha un'email associata",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const html = await staffOrderTemplate(order);
        const imageResponse = new ImageResponse(
            StaffOrderOG({
                order,
                qrCodeBase64: await generateQRCodeBase64(order.ticketId),
                logoBase64: getLogoBase64(),
            }),
            {
                width: 500,
                height: 650,                
            }
        );

        const emailResult = await sendEmail(
            order.email,
            "Ordine Panino - Festa di Primavera",
            html,
            {
                attachments: [
                    {
                        content: Buffer.from(await imageResponse.arrayBuffer()),
                        type: "image/png",
                        filename: "ordine-panino.png",
                    } as Attachment,
                ],
            }
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
                message: "Ordine inviato e email mandata con successo!",
                emailId: emailResult.data?.id,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    return new Response(
        JSON.stringify({
            message: "Ordine inviato!",
            orderId: orderUUID,
        }),
        {
            status: 201,
            headers: {
                "Content-Type": "text/plain",
            },
        }
    );
}

async function getStaffTicketId(): Promise<string> {
    const docRef = doc(
        STAFF_TICKETS_INCREMENTAL,
        `STAFF${new Date().getFullYear()}`
    );
    const ticketCounter = await getDoc(docRef);
    if (!ticketCounter.exists()) {
        await setDoc(docRef, { counter: 1 });
        return `STAFF${new Date().getFullYear().toString().slice(-2)}-0001`;
    }

    const currentNumber = ticketCounter.data().counter as number;

    const num = currentNumber + 1;
    await updateDoc(docRef, { counter: num });

    return `STAFF${new Date().getFullYear().toString().slice(-2)}-${num
        .toString()
        .padStart(4, "0")}`;
}

export async function PATCH({ request, locals }) {
    if (!locals.user) {
        return new Response(
            JSON.stringify({ message: "Non sei autenticato" }),
            { status: 401 }
        );
    }

    if (
        !hasAnyPermissions(locals.user.permissions, [
            UserPermissions.CUCINA,
            UserPermissions.CASSA,
        ])
    ) {
        return new Response(
            JSON.stringify({ message: "Non hai i permessi necessari" }),
            { status: 403 }
        );
    }

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
