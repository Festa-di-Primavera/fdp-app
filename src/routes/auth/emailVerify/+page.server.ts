import { applyActionCode, type Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { getClientApp } from '$lib/firebase/client.js';

export async function load({ url }) {
	const auth = getAuth(getClientApp());

	const mode = url.searchParams.get('mode');
	const actionCode: string | null = url.searchParams.get('oobCode');
	const continueUrl: string | null = url.searchParams.get('continueUrl');

	if (mode === 'verifyEmail' && actionCode) {
		handleVerifyEmail(auth, actionCode, continueUrl);
	}
}

async function handleVerifyEmail(auth: Auth, actionCode: string, continueUrl: string | null) {
	try{
		const resp = await applyActionCode(auth, actionCode);

		console.log(resp);

		const response = new Response(JSON.stringify({redirect: continueUrl}), {
			status: 200,
			headers: {
				'content-type': 'application/json'
			}
		});

		return response;
	}
	catch(error) {
		console.error(error);

		const response = new Response(JSON.stringify({error: error.message}), {
			status: 500,
			headers: {
				'content-type': 'application/json'
			}
		});

		return response;
	}
}