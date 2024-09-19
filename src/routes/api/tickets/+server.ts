import { json } from '@sveltejs/kit';
import { collection, getDocs, query, setDoc, doc, where, updateDoc } from 'firebase/firestore';
import { getClientDB } from '$lib/firebase/client.js';
import type { Ticket } from '../../../models/ticket';
import type { User } from 'lucia';
import { hasPermission } from '$lib/utils';
import { UserPermissions } from '../../../models/permissions';

export async function GET({locals}) {
	if(!locals.user){
		return new Response(JSON.stringify({message: 'Non sei autenticato'}), {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if(!hasPermission(locals.user.permissions, UserPermissions.TICKETS)){
		return new Response(JSON.stringify({message: 'Non hai i permessi necessari'}), {
			status: 403,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	const ticketsCollection = collection(getClientDB(), "tickets");
	const qTickets = query(ticketsCollection);
	const qSnapTickets = await getDocs(qTickets);

	//get sellers
	const usersCollection = collection(getClientDB(), "users");
	const qUsers = query(usersCollection, where("permissions", ">=", UserPermissions.SELL));
	const qSnapUsers = await getDocs(qUsers);

	const sellers = (qSnapUsers.docs.map((userDoc) => {
		return userDoc.data();
	}) as User[])
	.filter(
		(user) =>
			hasPermission(user.permissions, UserPermissions.SELL)
	);

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

export async function POST({request, locals}) {
	if(!locals.user){
		return new Response(JSON.stringify({message: 'Non sei autenticato'}), {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if(!hasPermission(locals.user.permissions, UserPermissions.GENERATE)){
		return new Response(JSON.stringify({message: 'Non hai i permessi necessari'}), {
			status: 403,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}
	
	const body = await request.json();
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

export async function PUT({request, locals}) {
	if(!locals.user){
		return new Response(JSON.stringify({message: 'Non sei autenticato'}), {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if(!hasPermission(locals.user.permissions, UserPermissions.TICKETS)){
		return new Response(JSON.stringify({message: 'Non hai i permessi necessari'}), {
			status: 403,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	const body: {
		attribute: string;
		toChange: 'name' | 'surname';
		ticketID: string;
	} = await request.json();

	let attrs
	if(body.toChange == 'name'){
		attrs = {
			name: body.attribute.toUpperCase()
		}
	}
	else if(body.toChange == 'surname'){
		attrs = {
			surname: body.attribute.toUpperCase()
		}
	}
	else{
		attrs = {}
	}

	const ticketsCollection = collection(getClientDB(), 'tickets')
	await updateDoc(doc(ticketsCollection, body.ticketID), attrs)
	
	return new Response('', {
		status: 200,
	})
}