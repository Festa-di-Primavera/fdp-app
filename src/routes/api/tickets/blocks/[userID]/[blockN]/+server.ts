import { getClientDB } from '$lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserPermissions } from '$models/permissions';
import { hasPermission } from '$lib/utils';

export async function POST({params, locals}) {
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
	const blockN = decodeURIComponent(params.blockN);

	const blockDoc = (await getDoc(doc(getClientDB(), "blocks", blockN)));

	if(blockDoc.exists()) {
		return new Response(JSON.stringify({ message: 'Blocchetto già assegnato' }), {
			// 409 Conflict
			status: 409,
			headers: {
				'content-type': 'application/json'
			}
		});
	}
	else{
		await setDoc(doc(getClientDB(), "blocks", blockN), {
			user: userID
		});
	}

	return new Response(JSON.stringify({ message: 'Blocchetto assegnato' }), {
		// 200 OK
		status: 200,
		headers: {
			'content-type': 'application/json'
		}
	});
}