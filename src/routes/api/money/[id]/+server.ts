import type { User } from '$lib/auth/user';
import { getClientDB } from '$lib/firebase/client';
import { hasPermission } from '$lib/utils/permissions.js';
import { UserPermissions } from '$models/permissions';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST({request, params, locals}){
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

	const amountToSubtract = (await request.json()).money;

	const usersCollection = collection(getClientDB(), 'users');
	const userDoc = doc(usersCollection, params.id);
	const user = (await getDoc(userDoc)).data() as User;

	const amount = user.owned_money;
	if(amount - amountToSubtract < 0){
		return new Response(JSON.stringify({message: `Riscatto troppo alto (max. ${amount})`}), {
			status: 400
		});
	}

	try{
		await updateDoc(userDoc, {
			owned_money: amount - amountToSubtract
		});
		return new Response(JSON.stringify({message: 'Debito saldato'}), {
			status: 200,
			headers: {
				'content-type': 'application/json'
			}
		});
	}
	catch(e){
		return new Response(JSON.stringify({message: 'Errore sconosciuto'}), {
			status: 500
		});
	}
}