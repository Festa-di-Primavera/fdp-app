import { hasPermission } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../../$types";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, "/login");

    if (!locals.user.email_verified) redirect(302, "/login/verify-email");

    if (!hasPermission(locals.user.permissions, UserPermissions.ORDINI))
        redirect(302, "/");

    return locals.user;
};
