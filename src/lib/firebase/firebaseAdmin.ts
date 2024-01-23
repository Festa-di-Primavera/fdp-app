import { CLIENT_EMAIL, PRIVATE_KEY, VITE_PROJECT_ID, VITE_STORAGE_BUCKET } from "$env/static/private";
import admin from "firebase-admin";

interface FirebaseAdminAppParams {
	projectId: string;
	clientEmail: string;
	privateKey: string;
	storageBucket: string;
}


function format(key: string){
	return key.replace(/\\n/g, "\n");
}

export function createAdminApp(params: FirebaseAdminAppParams){
	const privateKey = format(params.privateKey);

	if(admin.apps.length > 0){
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
		storageBucket: params.storageBucket,
	});
}

export function initAdmin(){
	const params: FirebaseAdminAppParams = {
		projectId: VITE_PROJECT_ID as string,
		clientEmail: CLIENT_EMAIL as string,
		privateKey: PRIVATE_KEY as string,
		storageBucket: VITE_STORAGE_BUCKET as string,
	};

    return createAdminApp(params);
}