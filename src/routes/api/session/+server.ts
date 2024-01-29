import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/* import { getAuth } from 'firebase-admin/auth'; */

import { ONE_WEEK_IN_SECONDS } from '$lib/constants';
import { createSessionCookie, verifyIdToken /* , getAdminApp */ } from '$lib/firebase/admin';

/* export async function POST(request) {
	const adminApp = getAuth(getAdminApp());

	const req = await request.json();
	const idToken = req.idToken.toString();
	const csrfToken = req.csrfToken.toString();

	if (csrfToken !== req.cookies.csrfToken) {
		return json({
			status: 401,
			body: {
				error: 'UNAUTHORIZED REQUEST!'
			}
		});
	}
	// Set session expiration to 5 days.
	const expiresIn = 60 * 60 * 24 * 5 * 1000;
	// Create the session cookie. This will also verify the ID token in the process.
	// The session cookie will have the same claims as the ID token.
	// To only allow session cookie setting on recent sign-in, auth_time in ID token
	// can be checked to ensure user was recently signed in before creating a session cookie.
	adminApp.createSessionCookie(idToken, { expiresIn }).then(
		(sessionCookie) => {
			// Set cookie policy for session cookie.
			const options = { maxAge: expiresIn, httpOnly: true, secure: true };
			res.cookie('session', sessionCookie, options);
			res.end(JSON.stringify({ status: 'success' }));
		},
		(error) => {
			return json({
				status: 401,
				body: {
					error: 'UNAUTHORIZED REQUEST!'
				}
			});
		}
	);
} */

// POST /auth/session
export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization') ?? '';
	const [scheme, token] = authHeader.split(' ');
	if (scheme !== 'Bearer' || !token) {
		return json({ status: 401, body: 'invalid authorization header' });
	}

	try {
		const { sub, email } = await verifyIdToken(token);

		const sessionCookie = await createSessionCookie(token, ONE_WEEK_IN_SECONDS);

		const user = {
			id: sub,
			email
		};

		return json({
			status: 200,
			body: user,
			headers: {
				'Set-Cookie': sessionCookie
			}
		});
	} catch {
		return json({ status: 401, body: 'invalid token' });
	}
};

const expiredCookie = 'session=; SameSite=Strict; Path=/; HttpOnly; Max-Age=0;';

export const DELETE: RequestHandler = () => {
	return json({
		status: 200,
		headers: {
			'Set-Cookie': expiredCookie
		}
	});
};

// TODO: gestire anche il refresh del cookie
