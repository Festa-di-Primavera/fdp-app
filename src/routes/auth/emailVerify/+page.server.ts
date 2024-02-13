import { applyActionCode, type Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { getClientApp } from '$lib/firebase/client.js';
import type { FirebaseError } from 'firebase/app';

export async function load({ url }) {
	const auth = getAuth(getClientApp());

	const mode = url.searchParams.get('mode');
	const actionCode: string | null = url.searchParams.get('oobCode');
	const continueUrl: string | null = url.searchParams.get('continueUrl');

	if (mode === 'verifyEmail' && actionCode) {
		return handleVerifyEmail(auth, actionCode, continueUrl);
	}

	return {
		status: 400,
		url: '/',
	};
}

async function handleVerifyEmail(auth: Auth, actionCode: string, continueUrl: string | null) {
	try{
		await applyActionCode(auth, actionCode);

		const response = {
			status: 200,
			url: continueUrl || '/',
		}

		return response;
	}
	catch(error) {
		let response;
		if ((error as FirebaseError).code === 'auth/invalid-action-code') {
			response = {
				status: 401,
				url: '/',
			}
		}
		else {
			response = {
				status: 500,
				url: '/',
			}
		}

		return response;
	}
}