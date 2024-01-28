import { json } from '@sveltejs/kit';

import { getAuth } from 'firebase-admin/auth';
import { collection, getDocs, query, setDoc, doc } from 'firebase/firestore';

import { getAdminApp } from '$lib/firebase/admin';
import { getClientDB } from '$lib/firebase/client.js';

import { roles } from '../../../models/role';
import type { Ticket } from '../../../models/ticket';

export async function GET() {
	const q = query(collection(getClientDB(), "tickets"));

	const app = getAuth(getAdminApp());
	const users = await app.listUsers();
	const sellers = users.users.filter((user) => user.customClaims?.accessLevel >= roles.SELLER);

	const querySnapshot = await getDocs(q);

	const tickets: Ticket[] = querySnapshot.docs.map((ticketDoc) => {
    	return (
			{
				ticketID: ticketDoc.id,
				name: ticketDoc.data().name,
				surname: ticketDoc.data().surname,
				checkIn: ticketDoc.data().checkIn?.toDate(),
				soldAt: ticketDoc.data().soldAt?.toDate(),
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
		const ticketRef = doc(getClientDB(), "tickets", code);
		await setDoc(ticketRef, {
			checkIn: null,
			name: null,
			seller: null,
			soldAt: null,
			surname: null
		} as Ticket);
	}

	return json({
		status: 200 // TODO: check if all tickets were added
	});

}