import { type RequestHandler } from '@sveltejs/kit';

import { ONE_WEEK_IN_SECONDS } from '$lib/constants';
import { createSessionCookie, getAdminApp, verifyIdToken /* , getAdminApp */ } from '$lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

// POST /auth/session
export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization') ?? '';
	const [scheme, token] = authHeader.split(' ');

	if (request.body) {
		const reqResolved = (await request.json());

		let name = reqResolved.name;
		const color = reqResolved.color;

		const adminApp = getAuth(getAdminApp());
		const userId = (await verifyIdToken(token)).uid;

		adminApp.updateUser(userId, { displayName: name });

		const allUsers = await getAuth(getAdminApp()).listUsers();

		const existingAliases = new Set<string>();

		allUsers.users.forEach((userRecord) => {
			existingAliases.add(userRecord.customClaims?.alias);
		});

		let validAlias = false;

		while(!validAlias){
			if(existingAliases.has(name)){
				const regex = /\d+$/;
				const matches = name.match(regex);

				if (matches) {
					const ultimoNumero = parseInt(matches[0]);
					const nuovoNumero = ultimoNumero + 1;
					name = name.replace(regex, '') + nuovoNumero;
				} else {
					name += '1';
				}
			} else {
				validAlias = true;
			}
		}

		adminApp.setCustomUserClaims(userId, {role: 'normal', accessLevel: 0, alias: name, color, money: 0, totMoney: 0});
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
		const response = new Response(JSON.stringify({message: 'Invalid Token'}), {
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
