import { getAuth } from 'firebase-admin/auth';

import { getAdminApp, getClaimsFromIdToken } from '$lib/firebase/admin';
import { redirect } from '@sveltejs/kit';
import { Role } from '../../models/role.js';

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

	if (userClaims?.accessLevel >= Role.SUPERADMIN) {
		const tok = await app.createCustomToken(userClaims?.uid || '');

		return {
			token: tok,
			usersList: JSON.stringify(await app.listUsers())
		};
	}

	throw redirect(302, '/');
}
