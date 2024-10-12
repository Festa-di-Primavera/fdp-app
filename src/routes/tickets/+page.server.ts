import { getClientDB } from "$lib/firebase/client";
import { hasPermission } from "$lib/utils/permissions";
import { redirect } from "@sveltejs/kit";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { User } from "lucia";
import type { PageServerLoad } from "./$types";
import { UserPermissions } from "$models/permissions";

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (!locals.user.email_verified)
		redirect(302, "/login/verify-email");

	if(!hasPermission(locals.user.permissions, UserPermissions.LISTA_BIGLIETTI)) {
		redirect(302, "/")
	}

	const usersCollection = collection(getClientDB(), "users");
	const qUsers = query(usersCollection, where("permissions", ">=", UserPermissions.VENDITA));
	const qSnapUsers = await getDocs(qUsers);

	const sellersList = (qSnapUsers.docs.map((userDoc) => {
		return userDoc.data();
	}) as User[])
	.filter(
		(user) =>
			hasPermission(user.permissions, UserPermissions.VENDITA)
	);

	const sellers: Map<string, string> = new Map();
	sellersList.forEach((seller: User) => {
		sellers.set(seller.id, seller.alias);
	});
	  

	return {
		currUser: locals.user,
		sellers
	};
};