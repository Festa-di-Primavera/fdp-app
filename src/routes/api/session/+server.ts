import { type RequestHandler } from '@sveltejs/kit';

import { ONE_WEEK_IN_SECONDS } from '$lib/constants';
import { createSessionCookie, getAdminApp, verifyIdToken /* , getAdminApp */ } from '$lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

function isTooLight(color: string) {
	const red = parseInt(color.slice(1, 3), 16);
    const green = parseInt(color.slice(3, 5), 16);
    const blue = parseInt(color.slice(5, 7), 16);

	const rNorm = 0.2126 * red
	const gNorm = 0.7152 * green
	const bNorm = 0.0722 * blue

	const lum = rNorm + gNorm + bNorm;

	return (lum/255) > 0.35;
  }

// POST /auth/session
export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization') ?? '';
	const [scheme, token] = authHeader.split(' ');

	if (request.body) {
		const name = (await request.json()).name;
		
		const adminApp = getAuth(getAdminApp());
		const userId = (await verifyIdToken(token)).uid;

		adminApp.updateUser(userId, {displayName: name});

		let randomColor: string;
		do{
			randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
			console.log('color: ', randomColor);
		} while(isTooLight(randomColor));

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
