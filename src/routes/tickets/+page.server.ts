import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { Role } from "../../models/role";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getClientDB } from "$lib/firebase/client";
import type { User } from "lucia";

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (!locals.user.email_verified)
		redirect(302, "/login/verify-email");

	if(locals.user.access_level < Role.SUPERADMIN){
		redirect(302, "/")
	}

	const users = collection(getClientDB(), "users");
	const q = query(users, where("access_level", ">=", Role.SELLER));
	const qSnap = await getDocs(q);
	const sellersList = qSnap.docs.map(doc => doc.data() as User);

	const sellers: Map<string, string> = new Map();
	sellersList.forEach((seller: User) => {
		sellers.set(seller.id, seller.alias);
	});
	  

	return {
		currUser: locals.user,
		sellers
	};
};