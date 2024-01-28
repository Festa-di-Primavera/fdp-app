import { /* collection, */ Timestamp, doc, setDoc, /* Timestamp */ } from "firebase/firestore"; 

import type { Actions } from "./$types";
import { getClientDB } from "$lib/firebase/client";


export const actions: Actions = {
	default: async ({ request/* , locals */ }) => {
		const formData = await request.formData();
		
		const name = formData.get("name");
		const surname = formData.get("surname");
		const code = formData.get("code");
		const seller = formData.get("user");

		const soldAt = Timestamp.fromDate(new Date());

		await setDoc(doc(getClientDB(), "tickets", `${code}`), {
			name: name,
			surname: surname,
			checkIn: null,
			soldAt: soldAt,
			seller: seller
		});
	}
};