import { initAdmin } from '$lib/firebase/firebaseAdmin';
import { json } from '@sveltejs/kit';

export async function PUT({params}) {
    console.log(params);
	const app = initAdmin();

	app.auth().setCustomUserClaims(params.uid, { role: params.newRole });
	
    // TODO: Check if user has been updated

	return json({
		status: 200
	});
}