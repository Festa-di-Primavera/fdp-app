import { json } from '@sveltejs/kit';

import { getAuth } from 'firebase-admin/auth';

import { getAdminApp } from '$lib/firebase/admin';

export async function DELETE({ params }){
	const app = getAuth(getAdminApp());
	try{
		app.deleteUser(params.uid)
		return json({
			status: 200,
			body: {
				message: 'User deleted'
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