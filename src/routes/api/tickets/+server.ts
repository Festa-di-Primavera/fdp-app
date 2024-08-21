import { json } from '@sveltejs/kit';
import { collection, getDocs, query, setDoc, doc, where } from 'firebase/firestore';
import { getClientDB } from '$lib/firebase/client.js';
import { Role } from '../../../models/role';
import type { Ticket } from '../../../models/ticket';
import type { User } from 'lucia';

export async function GET() {
	const ticketsCollection = collection(getClientDB(), "tickets");
	const qTickets = query(ticketsCollection);
	const qSnapTickets = await getDocs(qTickets);

	//get sellers
	const usersCollection = collection(getClientDB(), "users");
	const qUsers = query(usersCollection, where("access_level", ">=", Role.SELLER));
	const qSnapUsers = await getDocs(qUsers);

	const sellers = qSnapUsers.docs.map((userDoc) => {
		return userDoc.data();
	}) as User[];


	const tickets: Ticket[] = qSnapTickets.docs.map((ticketDoc) => {
    	return (
			{
				ticketID: ticketDoc.id,
				name: ticketDoc.data().name,
				surname: ticketDoc.data().surname,
				seller: sellers.find((seller: User) => seller.id === ticketDoc.data().seller)?.alias ?? null,
				soldAt: ticketDoc.data().soldAt?.toDate(),
				checkIn: ticketDoc.data().checkIn?.toDate(),
				checkOut: ticketDoc.data().checkOut?.toDate(),
				newCheckIn: ticketDoc.data().newCheckIn?.toDate()
			}
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
	for (const code of body.codes) {
		const ticketRef = doc(getClientDB(), "tickets", code);
		await setDoc(ticketRef, {
			name: null,
			surname: null,
			seller: null,
			soldAt: null,
			checkIn: null,
			newCheckIn: null,
			checkOut: null
		});
	}

	return json({
		status: 200 // TODO: check if all tickets were added
	});

}