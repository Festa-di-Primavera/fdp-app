import { db } from "$lib/firebase/firebase";
import { collection, query,  getDocs } from "firebase/firestore";

export async function load() {
	const q = query(collection(db, "tickets"));

	const querySnapshot = await getDocs(q);
	
	const tickets = querySnapshot.docs.map(doc => {
        return (
			{
				id: doc.id,
				name: doc.data().name,
				surname: doc.data().surname,
				checkIn: doc.data().checkIn ? doc.data().checkIn.toDate() : null,
			}
		);
	});

	return {
		data: {
			tickets
		}
	};
}
