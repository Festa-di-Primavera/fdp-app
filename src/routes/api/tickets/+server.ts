import { clientDB } from '$lib/firebase/firebase.js';
import { json } from '@sveltejs/kit';
import { collection, getDocs, query, setDoc, doc } from 'firebase/firestore';
import type { Ticket } from '../../../models/ticket';
import { initAdmin } from '$lib/firebase/firebaseAdmin';
import { roles } from '../../../models/role';

export async function GET() {
	const q = query(collection(clientDB, "tickets"));

	const app = initAdmin();
	const users = await app.auth().listUsers();
	const sellers = users.users.filter((user) => user.customClaims?.accessLevel >= roles.SELLER);


	const querySnapshot = await getDocs(q);

	
	
	const tickets = querySnapshot.docs.map((ticketDoc) => {
    	return (
			{
				ticketID: ticketDoc.id,
				name: ticketDoc.data().name,
				surname: ticketDoc.data().surname,
				checkIn: ticketDoc.data().checkIn ? ticketDoc.data().checkIn.toDate().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : null,
				soldAt: ticketDoc.data().soldAt ? ticketDoc.data().soldAt.toDate().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : null,
				seller: ticketDoc.data().seller ? sellers.find((seller) => seller.uid === ticketDoc.data().seller)?.customClaims?.alias : null
			} as Ticket
		);
	});

	return json({
		status: 200,
		body: {
			tickets
		}
	});
}

export async function POST(request) {
	const body = await request.request.json();

	for (const code of body) {
		const ticketRef = doc(clientDB, "tickets", code);
		await setDoc(ticketRef, {
			checkIn: null,
			name: null,
			seller: null,
			soldAt: null,
			surname: null
		});
	}

	return json({
		status: 200 // TODO: check if all tickets were added
	});

}