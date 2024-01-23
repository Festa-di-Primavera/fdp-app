import { initAdmin } from '$lib/firebase/firebaseAdmin.js';
import { json } from '@sveltejs/kit';

export async function DELETE({ params }){
	const app = initAdmin();
	try{
		app.auth().deleteUser(params.uid)
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
				message: e.message
			}
		});
	}
}