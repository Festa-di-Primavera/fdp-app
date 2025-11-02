import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { Google } from 'arctic';

export function createGoogleOAuthClient(origin: string) {
	const redirectUri = `${origin}/api/auth/google/callback`;
	return new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
}
