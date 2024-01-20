import { db } from "$lib/firebase/firebase";
import { collection, query,/*  where, */ getDocs } from "firebase/firestore";

export async function load() {
	const q = query(collection(db, "tickets"));

	const querySnapshot = await getDocs(q);
	
	const tickets = querySnapshot.docs.map(doc => {

        return ({
        id: doc.id,
		ticketID: doc.data().ticketID,
        name: doc.data().name,
        surname: doc.data().surname,
        checkIn: doc.data().checkIn.toDate()

    })});

	return {
		data: {
			tickets
		}
	};
}
