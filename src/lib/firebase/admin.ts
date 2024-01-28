import { FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } from '$env/static/private';
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import admin from 'firebase-admin';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getServerOnlyEnvVar } from '$lib/getServerOnlyEnvVar';

interface FirebaseAdminAppParams {
	projectId: string;
	clientEmail: string;
	privateKey: string;
	storageBucket: string;
}

function format(key: string) {
	return key.replace(/\\n/g, '\n');
}

const projectId = import.meta.env.VITE_PROJECT_ID;
const clientEmail = getServerOnlyEnvVar('FIREBASE_ADMIN_CLIENT_EMAIL');
const privateKey = getServerOnlyEnvVar('FIREBASE_ADMIN_PRIVATE_KEY')?.replace(/\\n/g, '\n'); // getServerOnlyEnvVar('FIREBASE_ADMIN_PRIVATE_KEY')
const storageBucket = import.meta.env.VITE_STORAGE_BUCKET;
const apiKey = import.meta.env.VITE_API_KEY;

if (!projectId || !clientEmail || !privateKey || !apiKey) {
	throw new Error('Firebase Admin environment variables not set');
}

const adminConfig = {
	credential: cert({
		privateKey,
		projectId,
		clientEmail
	}),
	projectId,
	storageBucket
};

export function createAdminApp(params: FirebaseAdminAppParams) {
	const privateKey = format(params.privateKey);

	if (admin.apps.length > 0) {
		return admin.app();
	}

	const cert = admin.credential.cert({
		project_id: params.projectId,
		client_email: params.clientEmail,
		private_key: privateKey
	} as admin.ServiceAccount);

	return admin.initializeApp({
		credential: cert,
		projectId: params.projectId,
		storageBucket: params.storageBucket
	});
}

export function initAdmin() {
	const params: FirebaseAdminAppParams = {
		projectId: import.meta.env.VITE_PROJECT_ID as string,
		clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL as string,
		privateKey: FIREBASE_ADMIN_PRIVATE_KEY as string,
		storageBucket: import.meta.env.VITE_STORAGE_BUCKET as string
	};

	return createAdminApp(params);
}
// TODO: sostituire tutte le istanze di initAdmin() con getAdminApp()

export const getAdminApp = (): App => (getApps().length ? getApp() : initializeApp(adminConfig));

export const createSessionCookie = async (token: string, maxAge: number) => {
	const expiresIn = maxAge * 1000;
	const auth = getAuth(getAdminApp());
	const session = await auth.createSessionCookie(token, {
		expiresIn
	});

	return `session=${session}; SameSite=Strict; Path=/; HttpOnly; Max-Age=${maxAge};`;
};

export const createSessionCookieForUserId = async (userId: string, maxAge: number) => {
	const auth = getAuth(getAdminApp());

	const customToken = await auth.createCustomToken(userId, {});
	const firebaseIdToken = await fetch(
		`https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=${apiKey}`,
		{
			method: 'POST',
			body: JSON.stringify({ token: customToken, returnSecureToken: true })
		}
	)
		.then((res) => res.json())
		.then((res) => res.idToken);

	return createSessionCookie(firebaseIdToken, maxAge);
};

export const verifyIdToken = (token: string): Promise<DecodedIdToken> => {
	const auth = getAuth(getAdminApp());
	return auth.verifyIdToken(token);
};

export const getIdTokenFromSessionCookie = async (
	sessionCookie: string | null
): Promise<DecodedIdToken | null> => {
	if (!sessionCookie) return null;

	const auth = getAuth(getAdminApp());

	return auth.verifySessionCookie(sessionCookie, true).catch(() => null);
};
