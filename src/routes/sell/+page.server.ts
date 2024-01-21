import { db } from "$lib/firebase/firebase";
import type { Actions } from "./$types";
import { /* collection, */ doc, setDoc, /* Timestamp */ } from "firebase/firestore"; 


export const actions: Actions = {
	default: async ({ request/* , locals */ }) => {
		const formData = await request.formData();
		
		const name = formData.get("name");
		const surname = formData.get("surname");
		const code = formData.get("code");

		await setDoc(doc(db, "tickets", `${code}`), {
			name: name,
			surname: surname,
			checkIn: null
		});
	}
};