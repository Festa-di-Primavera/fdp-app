import { initAdmin } from '$lib/firebase/firebaseAdmin';

export async function load() {
	const app = initAdmin();
	
	return {
		usersList: JSON.stringify(await app.auth().listUsers())
	}

}