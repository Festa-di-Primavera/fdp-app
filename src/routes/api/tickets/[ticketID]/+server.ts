import { Timestamp, updateDoc, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { getClientDB } from '$lib/firebase/client.js';
import type { Ticket } from '../../../../models/ticket';
import { convertCode } from '$lib/codeConverter';
import type { User } from 'lucia';
import { Role } from '../../../../models/role';
import { getEnumValueFromString } from '$lib/utils';

export async function GET( { params, locals } ) {
	if(!locals.user){
		return new Response(JSON.stringify({message: 'Non sei autenticato'}), {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if(getEnumValueFromString(Role, locals.user.role) <= Role.NORMAL){
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
			status: 404,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	const ticketDoc = (await getDoc(doc(getClientDB(), "tickets", code)));

	if(!ticketDoc.exists()) {
		return new Response(JSON.stringify({ message: 'Biglietto non esistente' }), {
			status: 404,
			headers: {
				'content-type': 'application/json'
			}
		});
	}
	
	//* GET DEL NOME DEL VENDITORE
	const usersCollection = collection(getClientDB(), "users");
	const qUser = doc(usersCollection, ticketDoc.data().seller);
	const seller = (await getDoc(qUser)).data() as User;
	const sellerName = seller?.alias
	
	const ticket: Ticket = {
		ticketID: ticketDoc.id,
		name: ticketDoc.data().name,
		surname: ticketDoc.data().surname,
		seller: sellerName ?? null,
		soldAt: ticketDoc.data().soldAt?.toDate() || null,
		checkIn: ticketDoc.data().checkIn?.toDate() || null,
		checkOut: ticketDoc.data().checkOut?.toDate() || null,
		newCheckIn: ticketDoc.data().newCheckIn?.toDate() || null
	};

	if(!ticketDoc.data().soldAt) {
		return new Response(JSON.stringify({ ticket }), {
			// 402 Payment Required (non venduto)
			status: 402,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	return new Response(JSON.stringify({ ticket, message: 'Biglietto validato' }), {
		// 206 Partial Content || 200 OK
		status: sellerName === null ? 206 : 200,
		headers: {
			'content-type': 'application/json'
		}
	});
}

export async function PUT( { params, locals } ) {
	if(!locals.user){
		return new Response(JSON.stringify({message: 'Non sei autenticato'}), {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if(getEnumValueFromString(Role, locals.user.role) < Role.CHECKIN){
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

	//* GET DEL NOME DEL VENDITORE
	const usersCollection = collection(getClientDB(), "users");
	const qUser = doc(usersCollection, ticketDoc.data().seller);
	const seller = (await getDoc(qUser)).data() as User;
	const sellerName = seller.alias
	
	const ticket: Ticket = {
		ticketID: ticketDoc.id,
		name: ticketDoc.data().name,
		surname: ticketDoc.data().surname,
		seller: sellerName ?? null,
		soldAt: ticketDoc.data().soldAt?.toDate() || null,
		checkIn: ticketDoc.data().checkIn?.toDate() || null,
		checkOut: ticketDoc.data().checkOut?.toDate() || null,
		newCheckIn: ticketDoc.data().newCheckIn?.toDate() || null
	};

	//* BIGLIETTO NON VENDUTO
	if(!ticket.soldAt) {
		return new Response(JSON.stringify({ ticket, message: 'Biglietto non venduto' }), {
			// 402 Payment Required
			status: 402,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	//* BIGLIETTO GIA' VALIDATO
	if(ticket.checkIn) {
		//* E NON USCITO
		if(!ticket.checkOut) {
			return new Response(JSON.stringify({ ticket, message: 'Biglietto già validato' }), {
				// 409 Conflict
				status: 409,
				headers: {
					'content-type': 'application/json'
				}
			});
		}
		//* E USCITO UNA VOLTA
		else {
			if(ticket.newCheckIn) {	
				return new Response(JSON.stringify({ ticket, message: 'Biglietto già rientrato', second: true }), {
					// 409 Conflict
					status: 409,
					headers: {
						'content-type': 'application/json'
					}
				});
			}
			const currentTimestamp = Timestamp.fromDate(new Date());
			await updateDoc(doc(getClientDB(), "tickets", code), {
				newCheckIn: currentTimestamp
			});

			ticket.newCheckIn = currentTimestamp.toDate();

			return new Response(JSON.stringify({ ticket, message: 'Biglietto validato (2^ entrata)', second: true }), {
				// 206 Partial Content || 200 OK
				status: sellerName === null ? 206 : 200,
				headers: {
					'content-type': 'application/json'
				}
			});
		}
	}

	//* BIGLIETTO NON ANCORA VALIDATO
	const currentTimestamp = Timestamp.fromDate(new Date());
	await updateDoc(doc(getClientDB(), "tickets", code), {
		checkIn: currentTimestamp
	});

	ticket.checkIn = currentTimestamp.toDate();

	return new Response(JSON.stringify({ ticket, message: 'Biglietto validato', second: false }), {
		// 206 Partial Content || 200 OK
		status: sellerName === null ? 206 : 200,
		headers: {
			'content-type': 'application/json'
		}
	});
}

export async function POST( { params, request, locals } ) {
	if(!locals.user){
		return new Response(JSON.stringify({message: 'Non sei autenticato'}), {
			status: 401,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	if(getEnumValueFromString(Role, locals.user.role) < Role.SELLER){
		return new Response(JSON.stringify({message: 'Non hai i permessi necessari'}), {
			status: 403,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}

	const formData = await request.json();
	const code = convertCode(params.ticketID);

	if(code === null){
		const response = new Response(JSON.stringify({ message: 'Codice non valido' }), {
			status: 404,
			headers: {
				'content-type': 'application/json'
			}
		});

		return response;
	}

	const name = formData.name;
	const surname = formData.surname;
	const seller = formData.seller;
	const soldAt = Timestamp.fromDate(new Date());

	const ticket = await getDoc(doc(getClientDB(), "tickets", code));

	if(!ticket.exists()){
		const response = new Response(JSON.stringify({ message: 'Biglietto non esistente' }), {
			status: 404,
			headers: {
				'content-type': 'application/json'
			}
		});

		return response;
	}
	
	if(ticket.data().soldAt){
		const response = new Response(JSON.stringify({ message: 'Biglietto già venduto' }), {
			status: 403,
			headers: {
				'content-type': 'application/json'
			}
		});

		return response;
	}

	try{
		await setDoc(doc(getClientDB(), "tickets", `${code}`), {
			name: name,
			surname: surname,
			checkIn: null,
			soldAt: soldAt,
			seller: seller
		});

		//* AGGIORNAMENTO SOLDI DEL VENDITORE
		const usersCollection = collection(getClientDB(), "users");
		const userDoc = doc(usersCollection, seller);
		const user = (await getDoc(userDoc)).data() as User;
		const userMoney = user.owned_money + 10;
		const totMoney = user.total_from_sales + 10;
		await updateDoc(userDoc, {
			owned_money: userMoney,
			total_from_sales: totMoney
		});


		const response = new Response(JSON.stringify({ message: 'Biglietto venduto' }), {
			status: 200,
			headers: {
				'content-type': 'application/json'
			}
		});

		return response;
	}
	catch(e) {
		const response = new Response(JSON.stringify({ message: 'Errore nella vendita' }), {
			status: 500,
			headers: {
				'content-type': 'application/json'
			}
		});

		return response;
	}
}