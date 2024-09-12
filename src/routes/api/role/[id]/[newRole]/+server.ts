import { getClientDB } from '$lib/firebase/client';

import { collection, doc, updateDoc } from 'firebase/firestore';
import { Role } from '../../../../../models/role';
import { getEnumValueFromString, getStringFromEnumValue } from '$lib/utils';

export async function PUT({ params, locals }) {
	if(!locals.user){
		return new Response(JSON.stringify({message: 'Non sei autenticato'}), {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if(getEnumValueFromString(Role, locals.user.role) < Role.SUPERADMIN){
		return new Response(JSON.stringify({message: 'Non hai i permessi necessari'}), {
			status: 403,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	try {
		const usersCollection = collection(getClientDB(), 'users');
		const userDoc = doc(usersCollection, params.id);
		await updateDoc(userDoc, {
			role: params.newRole,
			// field email_verified only if newRole == 'unverified'
			email_verified: params.newRole === getStringFromEnumValue(Role, Role.UNVERIFIED) ? false : true
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
