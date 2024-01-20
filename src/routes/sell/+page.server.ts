import { db } from "$lib/firebase/firebase";
import type { Actions } from "./$types";
import { /* collection, */ doc, setDoc, Timestamp } from "firebase/firestore"; 


export const actions: Actions = {
	default: async ({ request/* , locals */ }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		const surname = formData.get("surname");
		const code = formData.get("code");
		console.log(name);
		console.log(surname);
		console.log(code);

		//const ticketsTable = collection(db, "tickets");

		await setDoc(doc(db, "tickets", "Test"), {
			ticketID: code,
			name: name,
			surname: surname,
			checkIn: Timestamp.fromDate(new Date()),
		});
	}
};