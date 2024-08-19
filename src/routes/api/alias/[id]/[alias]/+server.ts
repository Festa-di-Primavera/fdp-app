import { getClientDB } from '$lib/firebase/client';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import type { User } from 'lucia';

export async function PUT({ params }) {
	const users = collection(getClientDB(), 'users');
	const qUser = query(users, where('alias', '==', params.alias));
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
		const userDoc = doc(users, userID);

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