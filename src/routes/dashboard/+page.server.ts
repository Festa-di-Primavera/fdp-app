import { clientDB } from '$lib/firebase/firebase.js';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import type { Ticket } from '../../models/ticket';

export async function load() {
    const q = query(collection(clientDB, "tickets"), where("checkIn", "!=", null), orderBy("checkIn"));
    const querySnapshot = await getDocs(q);

    const ticketData: Ticket[] = [];
    querySnapshot.docs.forEach(doc => {
        ticketData.push(doc.data() as Ticket);
    });
	
    // aggregate checkins by hour
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
	}

}