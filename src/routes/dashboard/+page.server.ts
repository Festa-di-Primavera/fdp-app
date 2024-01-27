import { initAdmin } from '$lib/firebase/firebaseAdmin';
import { collection, getDocs, query } from 'firebase/firestore';
import type { Ticket } from '../../models/ticket';
import { clientDB } from '$lib/firebase/firebase';
import { roles } from '../../models/role';

export async function load() {
	const app = initAdmin();
	const users = await app.auth().listUsers();
    
    const q = query(collection(clientDB, "tickets"));
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