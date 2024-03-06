import { getAuth } from 'firebase-admin/auth';

import { getAdminApp, getClaimsFromIdToken } from '$lib/firebase/admin';

import { Role } from '../../models/role';
import { redirect } from '@sveltejs/kit';

export async function load({cookies}) {
	/* if(new Date().getHours() >= 18 && (new Date().getHours() <= 20 && new Date().getMinutes() <= 5)){ */
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

		if (userClaims?.accessLevel == Role.CHECKOUT || userClaims?.accessLevel >= Role.ADMIN) {
			const tok = await app.createCustomToken(userClaims?.uid || '');

			return {
				token: tok
			};
		}
	/* } */

	throw redirect(302, '/');
}