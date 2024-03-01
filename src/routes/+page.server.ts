import { getAuth } from 'firebase-admin/auth';

import { getAdminApp, getClaimsFromIdToken } from '$lib/firebase/admin';

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

	if (userClaims) {
		const tok = await app.createCustomToken(userClaims?.uid || '');

		return {
			token: tok
		};
	}
}
