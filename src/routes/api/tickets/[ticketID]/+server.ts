import { getAuth } from 'firebase-admin/auth';
import { Timestamp, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';

import { getAdminApp } from '$lib/firebase/admin';
import { getClientDB } from '$lib/firebase/client.js';

import type { Ticket } from '../../../../models/ticket';

export async function GET( { params } ) {
	const adminApp = getAuth(getAdminApp());

	const ticketDoc = (await getDoc(doc(getClientDB(), "tickets", params.ticketID)));

	if(!ticketDoc.exists()) {
		return new Response(JSON.stringify({ message: 'Biglietto non esistente' }), {
			status: 404,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	const sellerID = ticketDoc.data().seller;
	if(!sellerID) {
		const ticket: Ticket = {
			ticketID: ticketDoc.id,
			name: ticketDoc.data().name,
			surname: ticketDoc.data().surname,
			seller: null,
			soldAt: ticketDoc.data().soldAt?.toDate() || null,
			checkIn: ticketDoc.data().checkIn?.toDate() || null,
			checkOut: ticketDoc.data().checkOut?.toDate() || null,
			newCheckIn: ticketDoc.data().newCheckIn?.toDate() || null
		};

		return new Response(JSON.stringify({ ticket }), {
			status: 402,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	
	let sellerName;
	try{
		const sellerID = ticketDoc.data().seller;
		const sellerUser = await adminApp.getUser(sellerID);
		sellerName = sellerUser.customClaims?.alias;
	}
	catch(e){
		sellerName = null;
	}

	const ticket: Ticket = {
		ticketID: ticketDoc.id,
		name: ticketDoc.data().name,
		surname: ticketDoc.data().surname,
		seller: sellerName,
		soldAt: ticketDoc.data().soldAt?.toDate() || null,
		checkIn: ticketDoc.data().checkIn?.toDate() || null,
		checkOut: ticketDoc.data().checkOut?.toDate() || null,
		newCheckIn: ticketDoc.data().newCheckIn?.toDate() || null
	};

	return new Response(JSON.stringify({ ticket, message: 'Biglietto validato' }), {
		// 206 Partial Content || 200 OK
		status: sellerName === null ? 206 : 200,
		headers: {
			'content-type': 'application/json'
		}
	});
}

export async function PUT( { params } ) {
	const adminApp = getAuth(getAdminApp());
	const ticketID = params.ticketID;

	const ticketDocRef = doc(getClientDB(), "tickets", ticketID);

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
	let sellerName;
	try{
		const sellerID = ticketDoc.data().seller;
		const sellerUser = await adminApp.getUser(sellerID);
		sellerName = sellerUser.customClaims?.alias;
	}
	catch(e){
		sellerName = null;
	}

	//* BIGLIETTO GIA' VALIDATO
	if(ticketDoc.data().checkIn) {
		//* E NON USCITO
		if(!ticketDoc.data().checkOut) {
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
			if(ticketDoc.data().newCheckIn) {
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
	
				return new Response(JSON.stringify({ ticket, message: 'Biglietto già validato (2 volte)', second: true }), {
					// 409 Conflict
					status: 409,
					headers: {
						'content-type': 'application/json'
					}
				});
			}
			const currentTimestamp = Timestamp.fromDate(new Date());
			await updateDoc(doc(getClientDB(), "tickets", ticketID), {
				newCheckIn: currentTimestamp
			});

			const ticket: Ticket = {
				ticketID: ticketDoc.id,
				name: ticketDoc.data().name,
				surname: ticketDoc.data().surname,
				seller: sellerName,
				soldAt: ticketDoc.data().soldAt?.toDate() || null,
				checkIn: ticketDoc.data().checkIn?.toDate() || null,
				checkOut: ticketDoc.data().checkOut?.toDate() || null,
				newCheckIn: currentTimestamp?.toDate()
			};

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
	await updateDoc(doc(getClientDB(), "tickets", ticketID), {
		checkIn: currentTimestamp
	});

	const ticket: Ticket = {
		ticketID: ticketDoc.id,
		name: ticketDoc.data().name,
		surname: ticketDoc.data().surname,
		seller: sellerName,
		soldAt: ticketDoc.data().soldAt?.toDate() || null,
		checkIn: currentTimestamp?.toDate(),
		checkOut: null,
		newCheckIn: null
	};

	return new Response(JSON.stringify({ ticket, message: 'Biglietto validato', second: false }), {
		// 206 Partial Content || 200 OK
		status: sellerName === null ? 206 : 200,
		headers: {
			'content-type': 'application/json'
		}
	});
}

export async function POST( { params, request } ) {
	const adminApp = getAuth(getAdminApp());

	const formData = await request.json();

	const name = formData.name;
	const surname = formData.surname;
	const code = params.ticketID;
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

		const sellerUser = await adminApp.getUser(seller);
		await adminApp.setCustomUserClaims(seller, {...sellerUser.customClaims, money: (sellerUser.customClaims?.money ?? 0) + 10, totMoney: (sellerUser.customClaims?.totMoney ?? 0) + 10});

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