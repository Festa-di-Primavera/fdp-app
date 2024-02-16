import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';

import { getAdminApp } from '$lib/firebase/admin';
import { getClientDB } from '$lib/firebase/client.js';

import type { Ticket } from '../../../../models/ticket';

export async function GET( { params } ) {
	const adminApp = getAuth(getAdminApp());

	const ticketDoc = (await getDoc(doc(getClientDB(), "tickets", params.ticketID)));

	if(!ticketDoc.exists()) {
		return json({
			status: 404,
			body: {
				message: "Invalid ticket ID"
			}
		});
	}

	const sellerID = ticketDoc.data().seller;
	if(!sellerID) {
		const ticket: Ticket = {
			ticketID: ticketDoc.id,
			name: ticketDoc.data().name,
			surname: ticketDoc.data().surname,
			checkIn: ticketDoc.data().checkIn?.toDate(),
			soldAt: ticketDoc.data().soldAt?.toDate(),
			seller: null
		} as Ticket;

		return json({
			status: 402,
			body: {
				ticket
			}
		});
	}
	
	try{
		const sellerUser = await adminApp.getUser(sellerID);
		const sellerName = sellerUser.customClaims?.alias;

		const ticket: Ticket = {
			ticketID: ticketDoc.id,
			name: ticketDoc.data().name,
			surname: ticketDoc.data().surname,
			checkIn: ticketDoc.data().checkIn?.toDate(),
			soldAt: ticketDoc.data().soldAt?.toDate(),
			seller: sellerName
		} as Ticket;
		
		return json({
			status: 200,
			body: {
				ticket
			}
		});
	}
	catch(e) {
		const ticket: Ticket = {
			ticketID: ticketDoc.id,
			name: ticketDoc.data().name,
			surname: ticketDoc.data().surname,
			checkIn: ticketDoc.data().checkIn?.toDate(),
			soldAt: ticketDoc.data().soldAt?.toDate(),
			seller: null
		} as Ticket;

		return json({
			status: 206,
			body: {
				ticket
			}
		});
	}
}

export async function PUT( { params } ) {
	const adminApp = getAuth(getAdminApp());
	const ticketID = params.ticketID;

	let ticketDoc = (await getDoc(doc(getClientDB(), "tickets", ticketID)));

	if(!ticketDoc.exists()) {
		return json({
			status: 404,
			body: {
				message: "Invalid ticket ID"
			}
		});
	}

	await updateDoc(doc(getClientDB(), "tickets", ticketID), {
		checkIn: Timestamp.fromDate(new Date())
	});
	ticketDoc = (await getDoc(doc(getClientDB(), "tickets", ticketID)));

	if(!ticketDoc.exists()) {
		return json({
			status: 404,
			body: {
				message: "Invalid ticket ID"
			}
		});
	}

	try{
		const sellerID = ticketDoc.data().seller;
		const sellerUser = await adminApp.getUser(sellerID);
		const sellerName = sellerUser.customClaims?.alias;

		const ticket: Ticket = {
			ticketID: ticketDoc.id,
			name: ticketDoc.data().name,
			surname: ticketDoc.data().surname,
			checkIn: ticketDoc.data().checkIn?.toDate(),
			soldAt: ticketDoc.data().soldAt?.toDate(),
			seller: sellerName
		} as Ticket;

		return json({
			status: 200,
			body: {
				ticket
			}
		});
	}
	catch(e) {
		const ticket: Ticket = {
			ticketID: ticketDoc.id,
			name: ticketDoc.data().name,
			surname: ticketDoc.data().surname,
			checkIn: ticketDoc.data().checkIn?.toDate(),
			soldAt: ticketDoc.data().soldAt?.toDate(),
			seller: null
		} as Ticket;

		return json({
			status: 206,
			body: {
				ticket
			}
		});
	}
}

export async function POST( { params, request } ) {
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