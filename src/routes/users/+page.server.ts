import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getClientDB } from "$lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";
import { hasPermission } from "$lib/utils/permissions";
import { UserPermissions } from "$models/permissions";
import type { User } from "$lib/auth/user";

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (!locals.user.email_verified)
		redirect(302, "/login/verify-email");

	if(!hasPermission(locals.user.permissions, UserPermissions.UTENTI)) {
		redirect(302, "/")
	}

	const db = getClientDB();

	const usersCollection = collection(db, "users");
	const qSnap = await getDocs(usersCollection);
	const usersList: User[] = qSnap.docs.map(doc => doc.data() as User);

	return {
		user: locals.user,
		usersList: usersList
	};
};