import { clientDB } from '$lib/firebase/firebase.js';
import { json } from '@sveltejs/kit';
import { Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import type { Ticket } from '../../../../models/ticket';

export async function GET( { params } ) {
	const ticketDoc = (await getDoc(doc(clientDB, "tickets", params.ticketID)));

	if(!ticketDoc.exists()) {
		return json({
			status: 404,
			body: {
				message: "Invalid ticket ID"
			}
		});
	}

	const ticket: Ticket = {
		ticketID: ticketDoc.id,
		name: ticketDoc.data().name,
		surname: ticketDoc.data().surname,
		checkIn: ticketDoc.data().checkIn ? ticketDoc.data().checkIn.toDate().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : null,
		soldAt: ticketDoc.data().soldAt ? ticketDoc.data().soldAt.toDate().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : null,
		seller: ticketDoc.data().seller
	} as Ticket;
	
	return json({
		status: 200,
		body: {
			ticket
		}
	});
}

export async function PUT( { params } ) {
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

	const ticket: Ticket = {
		ticketID: ticketDoc.id,
		name: ticketDoc.data().name,
		surname: ticketDoc.data().surname,
		checkIn: ticketDoc.data().checkIn ? ticketDoc.data().checkIn.toDate().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : null,
		soldAt: ticketDoc.data().soldAt ? ticketDoc.data().soldAt.toDate().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : null,
		seller: ticketDoc.data().seller
	} as Ticket;

	return json({
		status: 200,
		body: {
			ticket
		}
	});
}