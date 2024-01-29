import type { Handle } from '@sveltejs/kit';
import { createSessionCookieForUserId, getIdTokenFromSessionCookie } from '$lib/firebase/admin';
import { ONE_DAY_IN_SECONDS, ONE_WEEK_IN_SECONDS } from '$lib/constants'
import {getCookieValue} from '$lib/getCookieValue'
import type {DecodedIdToken} from 'firebase-admin/auth'

const SIX_DAYS_IN_SECONDS = ONE_DAY_IN_SECONDS * 6

const shouldRefreshToken = (token: DecodedIdToken | null) =>
	token && token.exp - Date.now() / 1000 < SIX_DAYS_IN_SECONDS

export const handle: Handle = async ({ event, resolve }) => {
	const cookie = event.request.headers.get('cookie');
	const token = await getIdTokenFromSessionCookie(getCookieValue(cookie, 'session'));

	console.log("cookie", cookie);
	console.log("token", token);

	/* event.locals.theme = getThemeFromCookie(cookie); */
	event.locals.idToken = token;

	const response = await resolve(event);

	if (!response.headers.get('set-cookie') && token && shouldRefreshToken(token)) {
		const freshSessionCookie = await createSessionCookieForUserId(token.uid, ONE_WEEK_IN_SECONDS);

		response.headers.set('set-cookie', freshSessionCookie);
	}

	return response;
};

export const getSession = ({ locals }: { locals: App.Locals }) => {
	console.log("getSession fired");
	// const theme = locals.theme;
	const user = locals.idToken ? { id: locals.idToken.sub, email: locals.idToken.email } : null;

	return { user };
};
