import { initAdmin } from '$lib/firebase/firebaseAdmin';
import { json } from '@sveltejs/kit';
import { roles } from '../../../../../models/role';

export async function PUT({params}) {
	const app = initAdmin();
	
	const enumBindings: {[key: string]: roles} = {
		'normal': roles.NORMAL,
		'seller': roles.SELLER,
		'check-in': roles.CHECKIN,
		'admin': roles.ADMIN,
		'superadmin': roles.SUPERADMIN
	};

	try{
		app.auth().setCustomUserClaims(params.uid, {...(await app.auth().getUser(params.uid)).customClaims, role: params.newRole, accessLevel: enumBindings[params.newRole]});
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