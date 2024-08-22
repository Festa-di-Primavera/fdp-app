import { getClientDB } from "$lib/firebase/client";
import { generatePasswordResetToken } from "$lib/lucia/utils/password";
import { redirect, type Actions } from "@sveltejs/kit";
import { collection, getDocs, query, where } from "firebase/firestore";

export const actions: Actions = {
	passwordReset: async ({request, locals}) => {
		if (locals.user)
			return redirect(302, "/");

		const formData = await request.formData();
		const email = formData.get('email') as string;
		
		// Check if email exists
		const usersCollection = collection(getClientDB(), 'users');
		const userQuery = query(usersCollection, where('email', '==', email));
		const existingUsers = (await getDocs(userQuery)).docs;

		if (existingUsers.length === 0)
			return {error: true, message: 'Account non trovato'};
		
		if (existingUsers.length > 1)
			return {error: true, message: 'Errore interno'};

		if (!existingUsers[0].data().email_verified)
			return {error: true, message: 'Account non verificato'};

		const resetToken = await generatePasswordResetToken(existingUsers[0].id);

		const {error, message} = await sendPasswordResetEmail(locals.user.id, code);
		if (error)
			return {error: true, message};
		else
			return redirect(302, '/');
	}
}