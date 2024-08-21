import { getClientDB } from '$lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function POST({params}) {
	const userID = params.userID;
	const blockN = decodeURIComponent(params.blockN);

	const blockDoc = (await getDoc(doc(getClientDB(), "blocks", blockN)));

	if(blockDoc.exists()) {
		return new Response(JSON.stringify({ message: 'Blocchetto già assegnato' }), {
			// 409 Conflict
			status: 409,
			headers: {
				'content-type': 'application/json'
			}
		});
	}
	else{
		await setDoc(doc(getClientDB(), "blocks", blockN), {
			user: userID
		});
	}

	return new Response(JSON.stringify({ message: 'Blocchetto assegnato' }), {
		// 200 OK
		status: 200,
		headers: {
			'content-type': 'application/json'
		}
	});
}