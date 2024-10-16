import { getClientDB } from '$lib/firebase/client';

import { Timestamp, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Ticket } from '$models/ticket';
import { convertCode } from '$lib/utils/tickets';
import { hasPermission } from '$lib/utils/permissions';
import { UserPermissions } from '$models/permissions';
import type { User } from '$lib/auth/user';

export async function PUT( { params, locals } ) {
	if(!locals.user){
		return new Response(JSON.stringify({message: 'Non sei autenticato'}), {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if(!hasPermission(locals.user.permissions, UserPermissions.CHECK_OUT)){
		return new Response(JSON.stringify({message: 'Non hai i permessi necessari'}), {
			status: 403,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}
	const code = convertCode(params.ticketID);

	if(code === null){
		return new Response(JSON.stringify({ message: 'Codice non valido' }), {
			// 404 Not Found
			status: 404,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	const ticketDocRef = doc(getClientDB(), "tickets", code);

	const ticketDoc = (await getDoc(ticketDocRef));

	//* BIGLIETTO NON ESISTENTE
	if(!ticketDoc.exists()) {
		return new Response(JSON.stringify({ message: 'Biglietto non valido' }), {
			// 404 Not Found
			status: 404,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	//* BIGLIETTO NON VENDUTO
	if(!ticketDoc.data().soldAt) {
		const ticket: Ticket = {
			ticketID: ticketDoc.id,
			name: ticketDoc.data().name,
			surname: ticketDoc.data().surname,
			seller: ticketDoc.data().seller,
			soldAt: ticketDoc.data().soldAt?.toDate() || null,
			checkIn: ticketDoc.data().checkIn?.toDate() || null,
			checkOut: ticketDoc.data().checkOut?.toDate() || null,
			newCheckIn: ticketDoc.data().newCheckIn?.toDate() || null,
		};			

		return new Response(JSON.stringify({ ticket, message: 'Biglietto non venduto' }), {
			// 402 Payment Required
			status: 402,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	//* GET DEL NOME DEL VENDITORE
	const usersCollection = collection(getClientDB(), "users");
	const qUser = doc(usersCollection, ticketDoc.data().seller);
	const seller = (await getDoc(qUser)).data() as User;
	const sellerName = seller.alias

	//* BIGLIETTO NON ANCORA VALIDATO
	if(!ticketDoc.data().checkIn) {
		const ticket: Ticket = {
			ticketID: ticketDoc.id,
			name: ticketDoc.data().name,
			surname: ticketDoc.data().surname,
			checkIn: ticketDoc.data().checkIn?.toDate() || null,
			soldAt: ticketDoc.data().soldAt?.toDate() || null,
			checkOut: ticketDoc.data().checkOut?.toDate() || null,
			newCheckIn: ticketDoc.data().newCheckIn?.toDate() || null,
			seller: sellerName
		};

		return new Response(JSON.stringify({ ticket, message: 'Biglietto non ancora validato' }), {
			// 406 Not Acceptable
			status: 406,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	if(ticketDoc.data().checkOut) {
		const ticket: Ticket = {
			ticketID: ticketDoc.id,
			name: ticketDoc.data().name,
			surname: ticketDoc.data().surname,
			checkIn: ticketDoc.data().checkIn?.toDate() || null,
			soldAt: ticketDoc.data().soldAt?.toDate() || null,
			checkOut: ticketDoc.data().checkOut?.toDate() || null,
			newCheckIn: ticketDoc.data().newCheckIn?.toDate() || null,
			seller: sellerName
		};

		return new Response(JSON.stringify({ ticket, message: 'Biglietto già uscito' }), {
			// 409 Conflict
			status: 409,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	const currentTimestamp = Timestamp.fromDate(new Date());
	await updateDoc(doc(getClientDB(), "tickets", code), {
		checkOut: currentTimestamp
	});

	const ticket: Ticket = {
		ticketID: ticketDoc.id,
		name: ticketDoc.data().name,
		surname: ticketDoc.data().surname,
		seller: sellerName,
		soldAt: ticketDoc.data().soldAt?.toDate() || null,
		checkIn: ticketDoc.data().checkIn?.toDate() || null,
		checkOut: currentTimestamp?.toDate(),
		newCheckIn: ticketDoc.data().newCheckIn?.toDate() || null
	};

	return new Response(JSON.stringify({ ticket, message: 'Può uscire' }), {
		// 206 Partial Content || 200 OK
		status: sellerName === null ? 206 : 200,
		headers: {
			'content-type': 'application/json'
		}
	});
}