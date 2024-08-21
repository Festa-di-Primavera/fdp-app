import { getClientDB } from '$lib/firebase/client';

import { collection, doc, updateDoc } from 'firebase/firestore';
import { enumBindings } from '../../../../../models/role';

export async function PUT({ params }) {
	try {
		const usersCollection = collection(getClientDB(), 'users');
		const userDoc = doc(usersCollection, params.id);
		await updateDoc(userDoc, {
			role: params.newRole,
			access_level: enumBindings[params.newRole],
			// field email_verified only if newRole == 'unverified'
			email_verified: params.newRole === 'unverified' ? false : true
		});

		const resp = new Response(JSON.stringify({ message: 'Ruolo modificato con successo' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});

		return resp;
	} catch (e) {
		const message = 'Errore sconosciuto';

		const resp = new Response(JSON.stringify({ message: message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});

		return resp;
	}
}
