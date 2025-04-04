import { deleteSessionTokenCookie, invalidateSession } from "$lib/auth/session";
import { fail, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, "/login");

    if (!locals.user.email_verified) redirect(302, "/login/verify-email");

    return locals.user;
};

export const actions: Actions = {
    logout: async (event) => {
        if (!event.locals.session) {
            return fail(401);
        }

        await invalidateSession(event.locals.session.id);
        deleteSessionTokenCookie(event);

        redirect(302, "/login");
    },
};
