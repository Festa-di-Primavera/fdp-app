import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

import { getAdminApp, getClaimsFromIdToken } from '$lib/firebase/admin';

export async function load({cookies}) {
	const app = getAuth(getAdminApp());

	const user: DecodedIdToken | null = await getClaimsFromIdToken(cookies);

	if (user) {
		const tok = await app.createCustomToken(user?.uid || '');

		return {
			token: tok
		};
	}
}
