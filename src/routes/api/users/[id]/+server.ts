import { getClientDB } from '$lib/firebase/client.js';
import { hasPermission } from '$lib/utils.js';
import { collection, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { UserPermissions } from '../../../../models/permissions';

export async function DELETE({ params, locals }){
	if(!locals.user){
		return new Response(JSON.stringify({message: 'Non sei autenticato'}), {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if(!hasPermission(locals.user.permissions, UserPermissions.USERS)){
		return new Response(JSON.stringify({message: 'Non hai i permessi necessari'}), {
			status: 403,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	try{
		const { id } = params;
		const usersCollection = collection(getClientDB(), 'users');
		const userDoc = doc(usersCollection, id);

		const user = await getDoc(userDoc);
		if(!user.exists()){
			const response = new Response(JSON.stringify({message: 'Utente non trovato'}), {
				status: 404,
				headers: {
					'Content-Type': 'text/plain'
				}
			});

			return response;
		}

		await deleteDoc(userDoc);

		const response = new Response(JSON.stringify({message: 'Utente eliminato'}), {
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