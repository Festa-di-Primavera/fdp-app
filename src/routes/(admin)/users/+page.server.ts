import type { User } from "$lib/auth/user";
import { USERS } from "$lib/firebase/collections";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { redirect } from "@sveltejs/kit";
import { getDocs } from "firebase/firestore";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, "/login");

    if (!locals.user.email_verified) redirect(302, "/login/verify-email");

    if (!hasAnyPermissions(locals.user.permissions, UserPermissions.UTENTI)) {
        redirect(302, "/");
    }

    const qSnap = await getDocs(USERS);
    const usersList: User[] = qSnap.docs.map((doc) => doc.data() as User);

    return {
        user: locals.user,
        usersList: usersList,
    };
};
