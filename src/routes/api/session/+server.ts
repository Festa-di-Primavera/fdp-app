import { type RequestHandler } from '@sveltejs/kit';

import { ONE_WEEK_IN_SECONDS } from '$lib/constants';
import { createSessionCookie, getAdminApp, verifyIdToken /* , getAdminApp */ } from '$lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';


// POST /auth/session
export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization') ?? '';
	const [scheme, token] = authHeader.split(' ');

	if (request.body) {
		const name = (await request.json()).name;
		
		const adminApp = getAuth(getAdminApp());
		const userId = (await verifyIdToken(token)).uid;

		adminApp.updateUser(userId, {displayName: name});

		const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
		adminApp.setCustomUserClaims(userId, {role: 'normal', accessLevel: 0, alias: name, color: randomColor});
	}

	if (scheme !== 'Bearer' || !token) {
		const response = new Response('invalid authorization header', {
			status: 401,
			headers: {
			  'Content-Type': 'text/plain'
			}
		});
		return response;
	}

	try {
		const userSession = await verifyIdToken(token);

		const sessionCookie = await createSessionCookie(token, ONE_WEEK_IN_SECONDS);

		const response = new Response(JSON.stringify(userSession), {
			status: 200,
			headers: {
				'Set-Cookie': sessionCookie,
				'Content-Type': 'application/json'
			}
		});
	  
		return response;
	} catch {
		const response = new Response('Invalid Token', {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
		return response	;
	}
};

const expiredCookie = 'session=; SameSite=Strict; Path=/; HttpOnly; Max-Age=0;';

export const DELETE: RequestHandler = () => {
	const response = new Response('', {
		status: 200,
		headers: {
			'Set-Cookie': expiredCookie
		}
	});

	return response;
};
