import { getClientApp, getClientDB } from '$lib/firebase/client.js';
import { signInWithCustomToken, getAuth as getClientAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function GET({params, request}) {
	const userID = params.userID;

	// get bearer token from request
	const headers = request.headers;
	const authorization = headers.get('authorization');
	if (!authorization) {
		return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
			// 401 Unauthorized
			status: 401,
			headers: {
				'content-type': 'application/json'
			}
		});
	}
	const token = authorization.split(' ')[1];

	const auth = getClientAuth(getClientApp());

	try{
		await signInWithCustomToken(auth, token);
	}
	catch(e){
		return new Response(JSON.stringify({ error: (e as Error).message }), {
			// 401 Unauthorized
			status: 401,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	try{
		const db = getClientDB();
		const blockRef = collection(db, 'blocks');
		const querySnapshot = await getDocs(query(blockRef, where("user", "==", userID)));

		const blocks = querySnapshot.docs.map(doc => doc.id);

		return new Response(JSON.stringify({ blocks }), {
			// 200 OK
			status: 200,
			headers: {
				'content-type': 'application/json'
			}
		});
	}
	catch(e){
		return new Response(JSON.stringify({ error: (e as Error).message }), {
			// 500 Internal Server Error
			status: 500,
			headers: {
				'content-type': 'application/json'
			}
		});
	}
}