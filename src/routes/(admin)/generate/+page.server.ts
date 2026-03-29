import { TICKETS } from "$lib/firebase/collections";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { fail, redirect } from "@sveltejs/kit";
import { doc, setDoc } from "firebase/firestore";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, "/login");

    if (!locals.user.email_verified) redirect(302, "/login/verify-email");

    if (!hasAnyPermissions(locals.user.permissions, UserPermissions.GENERAZIONE))
        redirect(302, "/");

    return locals.user;
};

export const actions = {
    default: async ({ request }) => {
        const formData = Object.fromEntries(await request.formData());

        if (
            !(formData.fileToUpload as File).name ||
            (formData.fileToUpload as File).name === "undefined"
        ) {
            return fail(400, {
                error: true,
                message: "You must provide a file to upload",
            });
        }

        const { fileToUpload } = formData as { fileToUpload: File };

        const fileContent = Buffer.from(await fileToUpload.arrayBuffer());

        const lines = fileContent.toLocaleString().trim().split("\r\n");
        const ticketsCodes: { ticketId: string; fiscalMatrixNumber: string }[] = lines.map((line) => {
            const [ticketId, fiscalMatrixNumber] = line.split(",");
            return { ticketId, fiscalMatrixNumber };
        });

        for (const code of ticketsCodes) {
            const ticketRef = doc(TICKETS, code.ticketId);
            await setDoc(ticketRef, {
                ticketId: code.ticketId,
                fiscalMatrixNumber: code.fiscalMatrixNumber,
                name: null,
                surname: null,
                seller: null,
                soldAt: null,
                checkIn: null,
            });
        }

        return {
            success: true,
        };
    },
};
