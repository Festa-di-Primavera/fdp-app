import { getAuth } from 'firebase-admin/auth';

import { getAdminApp, getClaimsFromIdToken } from '$lib/firebase/admin';
import { redirect } from '@sveltejs/kit';
import { roles } from '../../models/role.js';

export async function load({cookies}) {
	const app = getAuth(getAdminApp());

	const user = await getClaimsFromIdToken(cookies);

	if (user?.accessLevel >= roles.SUPERADMIN) {
		const tok = await app.createCustomToken(user?.uid || '');

		return {
			token: tok,
			usersList: JSON.stringify(await app.listUsers())
		};
	}

	throw redirect(302, '/');
}
