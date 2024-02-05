import { getAdminApp } from '$lib/firebase/admin.js';
import {getAuth} from 'firebase-admin/auth';
import type { FirebaseError } from 'firebase/app';

export async function PUT({ params }) {
	const allUsers = await getAuth(getAdminApp()).listUsers();
	let aliasAlreadyExists = false;

	allUsers.users.forEach(async (userRecord) => {
		if(userRecord.customClaims?.alias === params.alias){
			aliasAlreadyExists = true;
		}
	});

	if(aliasAlreadyExists){
		const response = new Response(JSON.stringify({message: 'L\'alias inserito è già in uso'}), {
			status: 409,
			headers: {
				'Content-Type': 'text/plain'
			}
		});

		return response;
	}

	const userID = params.uid;
	
	try{
		const user = await getAuth(getAdminApp()).getUser(userID);
		await getAuth(getAdminApp()).setCustomUserClaims(userID, {...user.customClaims, alias: params.alias});

		const response = new Response(JSON.stringify({message: 'Alias aggiornato'}), {
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