import { getClientDB } from '$lib/firebase/client';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import type { User } from 'lucia';

export async function POST({request, params}){
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