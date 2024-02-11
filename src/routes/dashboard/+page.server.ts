import { getAuth } from 'firebase-admin/auth';
import { collection, getDocs, query } from 'firebase/firestore';

import { getAdminApp, getClaimsFromIdToken } from '$lib/firebase/admin';
import { getClientDB } from '$lib/firebase/client';

import { roles } from '../../models/role';
import type { Ticket } from '../../models/ticket';
import { redirect } from '@sveltejs/kit';

export async function load({cookies}) {
	const app = getAuth(getAdminApp());
	
	const user = await getClaimsFromIdToken(cookies);

	if (user?.accessLevel >= roles.ADMIN) {
		const tok = await app.createCustomToken(user?.uid || '');

		const users = await app.listUsers();
		
		const q = query(collection(getClientDB(), "tickets"));
		const querySnapshot = await getDocs(q);
		
		const sellers = users.users.filter((user) => user.customClaims?.accessLevel >= roles.SELLER);

		const ticketData: Ticket[] = querySnapshot.docs.map((ticketDoc) => {

			let currSeller: string | null;

			if(!ticketDoc.data().seller) {
				currSeller = null;
			} else {
				if(sellers.find((seller) => seller.uid === ticketDoc.data().seller)) {
					currSeller = sellers.find((seller) => seller.uid === ticketDoc.data().seller)?.customClaims?.alias;
				} else {
					currSeller = "AnOnImO";
				}
			}

			return (
				{
					ticketID: ticketDoc.id,
					name: ticketDoc.data().name,
					surname: ticketDoc.data().surname,
					checkIn: ticketDoc.data().checkIn?.toDate() || null,
					soldAt: ticketDoc.data().soldAt?.toDate() || null,
					seller: currSeller,
				} as Ticket
			);
		});

		return {
			strTicketData: JSON.stringify(ticketData),
			token: tok
		};
	}

	throw redirect(302, '/');
}