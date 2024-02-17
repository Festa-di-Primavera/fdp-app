import { getAuth } from 'firebase-admin/auth';

import { getAdminApp, getClaimsFromIdToken } from '$lib/firebase/admin';

import { roles } from '../../models/role';
import { redirect } from '@sveltejs/kit';

export async function load({cookies}) {
	const app = getAuth(getAdminApp());
	
	const user = await getClaimsFromIdToken(cookies);

	if (user?.accessLevel >= roles.ADMIN) {
		const tok = await app.createCustomToken(user?.uid || '');

		const users = await app.listUsers();
		
		const sellers = users.users.filter((user) => user.customClaims?.accessLevel >= roles.SELLER);

		return {
			sellers:	sellers.map((seller) => {
							return {
								uid: seller.uid,
								alias: seller.customClaims?.alias,
							};
						}),
			token:		tok
		};
	}

	throw redirect(302, '/');
}