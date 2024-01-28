import { getAdminApp } from '$lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { json } from '@sveltejs/kit';
import { roles } from '../../../../../models/role';

export async function PUT({params}) {
	const app = getAuth(getAdminApp());
	
	const enumBindings: {[key: string]: roles} = {
		'normal': roles.NORMAL,
		'seller': roles.SELLER,
		'check-in': roles.CHECKIN,
		'admin': roles.ADMIN,
		'superadmin': roles.SUPERADMIN
	};

	try{
		app.setCustomUserClaims(params.uid, {...(await app.getUser(params.uid)).customClaims, role: params.newRole, accessLevel: enumBindings[params.newRole]}); // TODO: valutare se modificare la stringa e utilizzare il numero
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