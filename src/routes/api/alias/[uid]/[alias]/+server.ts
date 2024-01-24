import { initAdmin } from '$lib/firebase/firebaseAdmin.js';
import { json } from '@sveltejs/kit';

export async function PUT({ params }) {
	const adminApp = initAdmin();

	const allUsers = await adminApp.auth().listUsers();
	let aliasAlreadyExists = false;

	allUsers.users.forEach(async (userRecord) => {
		if(userRecord.customClaims?.alias === params.alias){
			aliasAlreadyExists = true;
		}
	});

	if(aliasAlreadyExists){
		return json({
			status: 409,
			body: {
				message: 'L\'alias inserito è già in uso'
			}
		});
	}

	const userID = params.uid;

	const user = await adminApp.auth().getUser(userID);
	
	try{
		adminApp.auth().setCustomUserClaims(userID, {...user.customClaims, alias: params.alias});
		return json({
			status: 200,
			body: {
				message: 'Alias aggiornato'
			}
		});
	}
	catch(e){
		return json({
			status: 500,
			body: {
				message: (e as Error).message
			}
		});
	}
}