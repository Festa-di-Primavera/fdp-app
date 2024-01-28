import { getAuth } from 'firebase-admin/auth';
import { collection, getDocs, query } from 'firebase/firestore';

import { getAdminApp } from '$lib/firebase/admin';
import { getClientDB } from '$lib/firebase/client';

import { roles } from '../../models/role';
import type { Ticket } from '../../models/ticket';

export async function load() {
	const app = getAuth(getAdminApp());
	const users = await app.listUsers();
    
    const q = query(collection(getClientDB(), "tickets"));
	const querySnapshot = await getDocs(q);
    
	const sellers = users.users.filter((user) => user.customClaims?.accessLevel >= roles.SELLER);

	const ticketData: Ticket[] = querySnapshot.docs.map((ticketDoc) => {
    	return (
			{
				ticketID: ticketDoc.id,
				name: ticketDoc.data().name,
				surname: ticketDoc.data().surname,
				checkIn: ticketDoc.data().checkIn?.toDate() || null,
				soldAt: ticketDoc.data().soldAt?.toDate() || null,
				seller: ticketDoc.data().seller ? sellers.find((seller) => seller.uid === ticketDoc.data().seller)?.customClaims?.alias : null
			} as Ticket
		);
	});

    return {
        strTicketData: JSON.stringify(ticketData)
    };
}