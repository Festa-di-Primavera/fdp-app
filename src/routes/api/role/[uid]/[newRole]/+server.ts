import { initAdmin } from '$lib/firebase/firebaseAdmin';
import { json } from '@sveltejs/kit';

export async function PUT({params}) {
	const app = initAdmin();

	try{
		app.auth().setCustomUserClaims(params.uid, { role: params.newRole });
		return json({
			status: 200,
			body: {
				message: 'User role updated'
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