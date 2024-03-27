import { getClientApp, getClientDB } from '$lib/firebase/client.js';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function POST({params, request}) {
	// get bearer token from request
	const headers = request.headers;
	const authorization = headers.get('authorization');
	if (!authorization) {
		return new Response(JSON.stringify({ message: 'Non autorizzato' }), {
			// 401 Unauthorized
			status: 401,
			headers: {
				'content-type': 'application/json'
			}
		});
	}
	const token = authorization.split(' ')[1];

	const auth = getAuth(getClientApp());
	
	try{
		await signInWithCustomToken(auth, token);
	}
	catch(e){
		return new Response(JSON.stringify({ message: 'Non autorizzato' }), {
			// 401 Unauthorized
			status: 401,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	const userID = params.userID;
	const blockN = decodeURIComponent(params.blockN);

	const blockDoc = (await getDoc(doc(getClientDB(), "blocks", blockN )));

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