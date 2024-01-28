import { getAdminApp } from '$lib/firebase/admin.js';
import {getAuth} from 'firebase-admin/auth'
import { json } from '@sveltejs/kit';

export async function PUT({ params }) {
	const allUsers = await getAuth(getAdminApp()).listUsers();
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

	const user = await getAuth(getAdminApp()).getUser(userID);
	
	try{
		getAuth(getAdminApp()).setCustomUserClaims(userID, {...user.customClaims, alias: params.alias});
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