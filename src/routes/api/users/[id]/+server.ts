import { getClientDB } from '$lib/firebase/client.js';
import { collection, deleteDoc, doc, getDoc } from 'firebase/firestore';

export async function DELETE({ params }){
	try{
		const { id } = params;
		const users = collection(getClientDB(), 'users');
		const userDoc = doc(users, id);

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