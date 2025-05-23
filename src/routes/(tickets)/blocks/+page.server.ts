import type { User } from "$lib/auth/user";
import { BLOCKS, USERS } from "$lib/firebase/collections";
import { hasAnyPermissions } from "$lib/utils/permissions";
import type { Block } from "$lib/utils/tickets";
import { UserPermissions } from "$models/permissions";
import { redirect } from "@sveltejs/kit";
import { getDocs, query, where } from "firebase/firestore";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, "/login");

    if (!locals.user.email_verified) redirect(302, "/login/verify-email");

    if (!hasAnyPermissions(locals.user.permissions, UserPermissions.UTENTI)) {
        redirect(302, "/");
    }

    const qUsers = query(
        USERS,
        where("permissions", ">=", UserPermissions.VENDITA)
    );

    const users = (await getDocs(qUsers)).docs.map((userDoc) => {
        return userDoc.data();
    }) as User[];
    const sellers = users.filter((user) =>
        hasAnyPermissions(user.permissions, UserPermissions.VENDITA)
    );

    const blocks = await getDocs(BLOCKS);
    const blockList = blocks.docs.map((blockDoc) => {
        const data = blockDoc.data();
        return {
            id: blockDoc.id,
            assigned_to: users.find((seller) => seller.id === data.assigned_to),
            assigned_by: users.find((user) => user.id === data.assigned_by),
            assigned_at: data.assigned_at?.toDate(),
        } as Block;
    }) as Block[];

    return {
        user: locals.user,
        sellers,
        blockList,
    };
};
