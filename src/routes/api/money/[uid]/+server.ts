import { getAdminApp } from '$lib/firebase/admin.js';
import { getAuth } from 'firebase-admin/auth';

export async function POST({request, params}){
	const amountToSubtract = (await request.json()).money;


	const adminApp = getAuth(getAdminApp());

	const user = await adminApp.getUser(params.uid);

	const amount = user.customClaims?.money || 0;
	if(amount - amountToSubtract < 0){
		return new Response(JSON.stringify({message: `Riscatto troppo alto (max. ${amount})`}), {
			status: 400
		});
	}

	try{
		await adminApp.setCustomUserClaims(params.uid, {
			...user.customClaims,
			money: amount - amountToSubtract
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