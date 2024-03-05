import { getAuth } from "firebase-admin/auth";
import { getAdminApp, getClaimsFromIdToken } from "$lib/firebase/admin";
import { Role } from "../../models/role";
import { redirect } from "@sveltejs/kit";

export async function load({cookies}) {
	const app = getAuth(getAdminApp());

	const userClaims = await getClaimsFromIdToken(cookies);

	if(userClaims){
		const user = await app.getUser(userClaims.uid);
		if(user?.customClaims?.accessLevel !== userClaims?.accessLevel) {
			return {
				logout: true
			}
		}
	}

	if (userClaims?.accessLevel >= Role.CHECKOUT) {
		const tok = await app.createCustomToken(userClaims?.uid || '');

		return {
			token: tok
		};
	}

	throw redirect(302, '/');
}