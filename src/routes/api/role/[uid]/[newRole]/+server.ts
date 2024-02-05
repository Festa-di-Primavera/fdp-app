import { getAdminApp } from '$lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { roles } from '../../../../../models/role';
import type { FirebaseError } from 'firebase-admin/app';

export async function PUT({params}) {
	const app = getAuth(getAdminApp());
	
	const enumBindings: {[key: string]: roles} = {
		'normal': roles.NORMAL,
		'seller': roles.SELLER,
		'check-in': roles.CHECKIN,
		'admin': roles.ADMIN,
		'superadmin': roles.SUPERADMIN
	};

	try{
		await app.setCustomUserClaims(params.uid, {...(await app.getUser(params.uid)).customClaims, role: params.newRole, accessLevel: enumBindings[params.newRole]});
		
		const resp = new Response(
			JSON.stringify({message: 'Ruolo modificato con successo'}),
			{status: 200, headers: {'Content-Type': 'application/json'}}
		);
		
		console.log(`Ruolo modificato con successo: ${params.uid} -> ${params.newRole}`);
		return resp;
	}
	catch(e){
		let message = 'Errore sconosciuto';
		switch ((e as FirebaseError).code) {
			case 'firebase-auth/user-not-found':
			  message = 'Utente non trovato';
			  break;
			case 'firebase-auth/permission-denied':
			  message = 'Permesso negato';
			  break;
			case 'app/network-error':
			  message = 'Errore di rete!!!';
			  break;
			default:
			  message = 'Errore sconosciuto';
			  break;
		}
		
		const resp = new Response(
			JSON.stringify({message: message}),
			{status: 500, headers: {'Content-Type': 'application/json'}}
		);

		return resp;
	}
}