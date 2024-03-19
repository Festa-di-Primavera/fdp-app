import { getAuth } from 'firebase-admin/auth';

import { getAdminApp, getClaimsFromIdToken } from '$lib/firebase/admin';

import { Role } from '../../models/role';
import { redirect } from '@sveltejs/kit';

export async function load({cookies}) {
	const currentDate = new Date();

	const startDate = new Date('2024-04-17T17:59:00');
	const endDate = new Date('2024-04-17T20:15:00');

	if(currentDate >= startDate && currentDate <= endDate){
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
	}
	else{
		throw redirect(302, '/?checkOutExpired');
	}

	throw redirect(302, '/');
}