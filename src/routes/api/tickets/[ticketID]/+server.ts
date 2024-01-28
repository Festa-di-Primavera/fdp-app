import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore';

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