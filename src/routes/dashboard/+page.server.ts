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


    /* // aggregate checkins by hour
    const checkInsByHour: { x: string, y: number }[] = []; 

    let currentHour = 0;
    let currentHourCheckIns = 0;

    for (const ticket of ticketData) {
        const ticketDate = new Date(ticket.checkIn.toMillis());
        const ticketHour = ticketDate.getHours();

        if (ticketHour !== currentHour) {
            checkInsByHour.push({ x: ticketHour.toString(), y: currentHourCheckIns });
            currentHour = ticketHour;
            currentHourCheckIns = 0;
        }
        currentHourCheckIns++;
    }


	return {
		checkIn: JSON.stringify(checkInsByHour),
        numberOfCheckIns: ticketData.length,
	} */
}