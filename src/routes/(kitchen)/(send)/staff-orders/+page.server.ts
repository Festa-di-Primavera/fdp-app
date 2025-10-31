import { hasAnyPermissions } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { redirect, error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { Order } from "$models/order";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, "/login");

    if (!locals.user.email_verified) redirect(302, "/login/verify-email");

    if (!hasAnyPermissions(locals.user.permissions, UserPermissions.ORDINI))
        redirect(302, "/");

    return locals.user;
};

export const actions = {
    sendOrder: async ({ request, locals }) => {
        if (!locals.user) redirect(302, "/login");

        if (!locals.user.email_verified) redirect(302, "/login/verify-email");

        if (
            !hasAnyPermissions(locals.user.permissions, [UserPermissions.ORDINI, UserPermissions.CASSA])
        )
            redirect(302, "/");

        let body: Order;
        try {
            body = await request.json();
        } catch (e) {
            throw error(400, "Invalid request body");
        }

        // Validate required fields
        if (
            !body.name ||
            !body.surname ||
            !body.email ||
            !body.items ||
            body.items.length === 0
        ) {
            throw error(400, "Missing required fields");
        }

        // Process order...
        return { success: true, message: "Ordine inviato con successo!" };
    },
};
