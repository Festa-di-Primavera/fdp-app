import { getApps, getApp, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
	getAuth,
	inMemoryPersistence,
	sendSignInLinkToEmail,
	setPersistence,
	isSignInWithEmailLink,
	signInWithEmailLink
} from 'firebase/auth';

const clientConfig = {
	apiKey: import.meta.env.VITE_API_KEY,
	authDomain: import.meta.env.VITE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_APP_ID
};

/* const firebaseApp = initializeApp(clientConfig); */

export const getClientApp = () => {
	if (getApps().length) return getApp();

	const app = initializeApp(clientConfig);
	const auth = getAuth(app);
	setPersistence(auth, inMemoryPersistence);

	return app;
};

/* export const clientDB = getFirestore(firebaseApp);
export const clientAuth = getAuth(firebaseApp); */

export const getClientDB = () => getFirestore(getClientApp());

export const isMagicLink = (link: string) => {
	const auth = getAuth(getClientApp());

	return isSignInWithEmailLink(auth, link);
};

export const signInWithMagicLink = (email: string, link: string) => {
	const auth = getAuth(getClientApp());

	return signInWithEmailLink(auth, email, link);
};

export const sendMagicLink = (email: string, redirectUrl: string) => {
	const auth = getAuth(getClientApp());
	const actionCodeSettings = {
		url: redirectUrl,
		handleCodeInApp: true
	};
	return sendSignInLinkToEmail(auth, email, actionCodeSettings);
};
