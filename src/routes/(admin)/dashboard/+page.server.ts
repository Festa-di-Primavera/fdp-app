import type { User } from "$lib/auth/user";
import { USERS } from "$lib/firebase/collections";
import { hasAnyPermissions } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import { redirect } from "@sveltejs/kit";
import { getDocs, query, where } from "firebase/firestore";
import type { PageServerLoad } from "../../$types";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, "/login");

    if (!locals.user.email_verified) redirect(302, "/login/verify-email");

    if (!hasAnyPermissions(locals.user.permissions, UserPermissions.DASHBOARD))
        redirect(302, "/");

    const qUsers = query(
        USERS,
        where("permissions", ">=", UserPermissions.VENDITA)
    );
    const qSnapUsers = await getDocs(qUsers);

    const sellers = (
        qSnapUsers.docs.map((userDoc) => {
            return userDoc.data();
        }) as User[]
    ).filter((user) =>
        hasAnyPermissions(user.permissions, UserPermissions.VENDITA)
    );

    return {
        user: locals.user,
        sellers,
    };
};
