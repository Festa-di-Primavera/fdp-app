import { getAuth } from 'firebase-admin/auth';

import { getAdminApp, getClaimsFromIdToken } from '$lib/firebase/admin';

import { roles } from '../../models/role';
import { redirect } from '@sveltejs/kit';

export async function load({cookies}) {
	const app = getAuth(getAdminApp());
	const user = await getClaimsFromIdToken(cookies);

	if (user?.accessLevel >= roles.CHECKIN) {
		const tok = await app.createCustomToken(user?.uid || '');

		return {
			token: tok
		};
	}

	throw redirect(302, '/');
}