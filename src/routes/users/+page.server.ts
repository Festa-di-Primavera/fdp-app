import { getAuth } from 'firebase-admin/auth';

import { getAdminApp } from '$lib/firebase/admin';

export async function load() {
	const app = getAuth(getAdminApp());

	return {
		usersList: JSON.stringify(await app.listUsers())
	};
}
