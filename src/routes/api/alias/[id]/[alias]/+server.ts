import { getClientDB } from '$lib/firebase/client';
import { hasPermission } from '$lib/utils.js';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import type { User } from 'lucia';
import { UserPermissions } from '../../../../../models/permissions';

export async function PUT({ params, locals }) {
	if(!locals.user){
		return new Response(JSON.stringify({message: 'Non sei autenticato'}), {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if(!hasPermission(locals.user.permissions, UserPermissions.UTENTI)){
		return new Response(JSON.stringify({message: 'Non hai i permessi necessari'}), {
			status: 403,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	const usersCollection = collection(getClientDB(), 'users');
	const qUser = query(usersCollection, where('alias', '==', params.alias));
	const userDocs = (await getDocs(qUser)).docs.map(doc => doc.data() as User);

	const aliasAlreadyExists = userDocs.length > 0;

	if(aliasAlreadyExists){
		const response = new Response(JSON.stringify({message: 'L\'alias inserito è già in uso'}), {
			status: 409,
			headers: {
				'Content-Type': 'text/plain'
			}
		});

		return response;
	}

	const userID = params.id;
	
	try{
		const userDoc = doc(usersCollection, userID);

		await updateDoc(userDoc, {alias: params.alias});

		const response = new Response(JSON.stringify({message: 'Alias aggiornato'}), {
			status: 200,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
		
		return response;
	}
	catch(e){
		const message = 'Errore sconosciuto';
		const code = 500;
		
		const response = new Response(JSON.stringify({message: message}), {
			status: code,
			headers: {
				'Content-Type': 'text/plain'
			}
		});

		return response;
	}
}