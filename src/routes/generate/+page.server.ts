import { getAuth } from 'firebase-admin/auth';

import { getAdminApp, getClaimsFromIdToken } from '$lib/firebase/admin';

/* import { roles } from '../../models/role'; */
import { redirect } from '@sveltejs/kit';

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

	/* if (userClaims?.accessLevel >= roles.SUPERADMIN) { */
	if(userClaims?.email === import.meta.env.VITE_ADMIN_EMAIL1 || userClaims?.email === import.meta.env.VITE_ADMIN_EMAIL2) {
		const tok = await app.createCustomToken(userClaims?.uid ?? '');

		return {
			token: tok
		};
	}

	throw redirect(302, '/');
}