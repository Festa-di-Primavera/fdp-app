import { verifyPasswordResetCode, type Auth, applyActionCode, checkActionCode } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { getClientApp } from '$lib/firebase/client.js';
import type { FirebaseError } from 'firebase/app';
import type { ActionData } from '../../../models/email_action_data.js';

export async function load({ url }) {
	const auth = getAuth(getClientApp());

	const mode = url.searchParams.get('mode');
	const actionCode: string | null = url.searchParams.get('oobCode');
	const continueUrl: string | null = url.searchParams.get('continueUrl');

	if(actionCode && mode)
		if (mode === 'resetPassword') {
			return handlePasswordReset(auth, actionCode, continueUrl);
		}
		else if(mode === 'verifyEmail') {
			return handleVerifyEmail(auth, actionCode, continueUrl);
		}
		else if (mode === 'recoverEmail') {
			return handleRecoverEmail(auth, actionCode, continueUrl);
		}
		else if (mode === 'verifyAndChangeEmail') {
			return handleVerifyAndChangeEmail(auth, actionCode, continueUrl);
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

async function handleVerifyEmail( auth: Auth, actionCode: string, continueUrl: string | null): Promise<ActionData> {
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

async function handleRecoverEmail(auth: Auth, actionCode: string, continueUrl: string | null): Promise<ActionData> {
	const response: ActionData = {
		mode: 'recoverEmail',
		status: 200
	};
	
	try{
		const infos = await checkActionCode(auth, actionCode);
		await applyActionCode(auth, actionCode);

		response.email = infos.data.email ? infos.data.email : undefined;
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

async function handleVerifyAndChangeEmail(auth: Auth, actionCode: string, continueUrl: string | null): Promise<ActionData> {
	const response: ActionData = {
		mode: 'verifyAndChangeEmail',
		status: 200
	};
	
	try{
		const infos = await checkActionCode(auth, actionCode);
		await applyActionCode(auth, actionCode);

		response.email = infos.data.email ? infos.data.email : undefined;
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