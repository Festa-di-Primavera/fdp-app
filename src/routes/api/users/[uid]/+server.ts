import { getAuth } from 'firebase-admin/auth';

import { getAdminApp } from '$lib/firebase/admin';
import type { FirebaseError } from 'firebase/app';

export async function DELETE({ params }){
	const app = getAuth(getAdminApp());
	try{
		await app.deleteUser(params.uid);

		const response = new Response(JSON.stringify({message: 'Utente eliminato'}), {
			status: 200,
			headers: {
				'Content-Type': 'text/plain'
			}
		});

		return response;
	}
	catch(e){
		let message = 'Errore sconosciuto';
		let code = 500;

		switch((e as FirebaseError).code){
			case 'auth/user-not-found':
				message = 'Utente non trovato';
				code = 404;
				break;
			case 'auth/invalid-uid':
				message = 'UID non valido';
				break;
			case 'app/network-error':
				message = 'Errore di rete';
				break;
			default:
				message = 'Errore sconosciuto';
				break;
		}

		const response = new Response(JSON.stringify({message: message}), {
			status: code,
			headers: {
				'Content-Type': 'text/plain'
			}
		});

		return response;
	}
}