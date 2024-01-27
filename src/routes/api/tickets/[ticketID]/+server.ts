import { clientDB } from '$lib/firebase/firebase.js';
import { json } from '@sveltejs/kit';
import { Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import type { Ticket } from '../../../../models/ticket';
import { initAdmin } from '$lib/firebase/firebaseAdmin';

export async function GET( { params } ) {
	const adminApp = initAdmin();

	const ticketDoc = (await getDoc(doc(clientDB, "tickets", params.ticketID)));

	if(!ticketDoc.exists()) {
		return json({
			status: 404,
			body: {
				message: "Invalid ticket ID"
			}
		});
	}

	const sellerID = ticketDoc.data().seller;
	const sellerUser = await adminApp.auth().getUser(sellerID);
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

export async function PUT( { params } ) {
	const adminApp = initAdmin();
	const ticketID = params.ticketID;

	let ticketDoc = (await getDoc(doc(clientDB, "tickets", ticketID)));

	if(!ticketDoc.exists()) {
		return json({
			status: 404,
			body: {
				message: "Invalid ticket ID"
			}
		});
	}

	await updateDoc(doc(clientDB, "tickets", ticketID), {
		checkIn: Timestamp.fromDate(new Date())
	});
	ticketDoc = (await getDoc(doc(clientDB, "tickets", ticketID)));

	if(!ticketDoc.exists()) {
		return json({
			status: 404,
			body: {
				message: "Invalid ticket ID"
			}
		});
	}

	const sellerID = ticketDoc.data().seller;
	const sellerUser = await adminApp.auth().getUser(sellerID);
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