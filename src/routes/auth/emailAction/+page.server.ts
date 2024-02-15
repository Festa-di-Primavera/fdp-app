import { verifyPasswordResetCode, type Auth, applyActionCode } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { getClientApp } from '$lib/firebase/client.js';
import type { FirebaseError } from 'firebase/app';
import type { ActionData } from '../../../models/email_action_data.js';

export async function load({ url }) {
	const auth = getAuth(getClientApp());

	const mode = url.searchParams.get('mode');
	const actionCode: string | null = url.searchParams.get('oobCode');
	const continueUrl: string | null = url.searchParams.get('continueUrl');

	if (mode === 'resetPassword' && actionCode) {
		return handlePasswordReset(auth, actionCode, continueUrl);
	}
	else if(mode === 'verifyEmail' && actionCode) {
		return handleVerifyEmail(mode, auth, actionCode, continueUrl);
	}

	const response: ActionData = {
		mode: null,
		status: 400,
		url: '/',
	};

	return response;
}

async function handlePasswordReset(auth: Auth, actionCode: string, continueUrl: string | null): Promise<ActionData> {
	const response: ActionData = {
		mode: 'resetPassword',
		status: 200
	};

	try{
		const email = await verifyPasswordResetCode(auth, actionCode);

		response.url = continueUrl || '/';
		response.email = email;
		response.actionCode = actionCode;

		return response;
	}
	catch(error) {
		if ((error as FirebaseError).code === 'auth/invalid-action-code') {
			response.status = 401;
			response.url = '/';
		}
		else {
			response.status = 500;
			response.url = '/';
		}

		return response;
	}
}

async function handleVerifyEmail(mode: string, auth: Auth, actionCode: string, continueUrl: string | null): Promise<ActionData> {
	const response: ActionData = {
		mode: 'verifyEmail',
		status: 200
	};
	try{
		await applyActionCode(auth, actionCode);

		response.url = continueUrl || '/';

		return response;
	}
	catch(error) {
		if ((error as FirebaseError).code === 'auth/invalid-action-code') {
			response.status = 401;
			response.url = '/';
		}
		else {
			response.status = 500;
			response.url = '/';
		}

		return response;
	}
}