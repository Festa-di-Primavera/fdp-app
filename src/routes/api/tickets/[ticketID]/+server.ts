import { db } from '$lib/firebase/firebase.js';
import { json } from '@sveltejs/kit';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';

export async function GET( { params } ) {
	const q = query(collection(db, "tickets"), where(documentId(), "in",
	[
	  params.ticketID
	]));

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

	return json({
		status: 200,
		body: {
			tickets
		}
	});
}