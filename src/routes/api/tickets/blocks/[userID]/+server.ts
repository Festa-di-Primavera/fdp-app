import { getClientDB } from '$lib/firebase/client.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { UserPermissions } from '../../../../../models/permissions';
import { hasPermission } from '$lib/utils';

export async function GET({params, locals}) {
	if(!locals.user){
		return new Response(JSON.stringify({message: 'Non sei autenticato'}), {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if(!hasPermission(locals.user.permissions, UserPermissions.UTENTI)){
		return new Response(JSON.stringify({message: 'Non hai i permessi necessari'}), {
			status: 403,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	const userID = params.userID;

	try{
		const db = getClientDB();
		const blockRef = collection(db, 'blocks');
		const querySnapshot = await getDocs(query(blockRef, where("user", "==", userID)));

		const blocks = querySnapshot.docs.map(doc => doc.id);

		return new Response(JSON.stringify({ blocks }), {
			// 200 OK
			status: 200,
			headers: {
				'content-type': 'application/json'
			}
		});
	}
	catch(e){
		return new Response(JSON.stringify({ error: (e as Error).message }), {
			// 500 Internal Server Error
			status: 500,
			headers: {
				'content-type': 'application/json'
			}
		});
	}
}