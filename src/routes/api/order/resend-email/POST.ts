import { staffOrderTemplate } from "$lib/utils/email-templates/staff-order";
import StaffOrderOG from "$lib/utils/email-templates/StaffOrderOG";
import {
	generateQRCodeBase64,
	getLogoBase64,
} from "$lib/utils/imageGenerator.js";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { sendEmail } from "$lib/utils/resend";
import type { Order } from "$models/order";
import { UserPermissions } from "$models/permissions";
import { ImageResponse } from "@vercel/og";
import type { Attachment } from "resend";

export async function handleRequest(request: Request, locals: App.Locals) {
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

    if (!hasAnyPermissions(locals.user.permissions, [UserPermissions.ORDINI])) {
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

    if (!order.email) {
        return new Response(
            JSON.stringify({ message: "L'ordine non ha un'email associata" }),
            {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                },
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
            message: "Email reinviata con successo!",
        }),
        {
            status: 201,
            headers: {
                "Content-Type": "text/plain",
            },
        }
    );
}
