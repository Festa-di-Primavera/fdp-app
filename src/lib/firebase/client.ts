import { getApps, getApp, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
	getAuth,
	inMemoryPersistence,
	setPersistence
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
