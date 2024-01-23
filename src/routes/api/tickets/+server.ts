import { clientDB } from '$lib/firebase/firebase.js';
import { json } from '@sveltejs/kit';
import { collection, getDocs, query } from 'firebase/firestore';
import type { Ticket } from '../../../models/ticket';

export async function GET() {
	const q = query(collection(clientDB, "tickets"));

	const querySnapshot = await getDocs(q);
	
	const tickets = querySnapshot.docs.map(ticketDoc => {
        return (
			{
				ticketID: ticketDoc.id,
				name: ticketDoc.data().name,
				surname: ticketDoc.data().surname,
				checkIn: ticketDoc.data().checkIn ? ticketDoc.data().checkIn.toDate().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : null,
				soldAt: ticketDoc.data().soldAt ? ticketDoc.data().soldAt.toDate().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : null,
				seller: ticketDoc.data().seller
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