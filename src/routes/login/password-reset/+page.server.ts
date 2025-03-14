import {
    generatePasswordResetToken,
    sendPasswordResetEmail,
} from "$lib/auth/utils/password";
import { USERS } from "$lib/firebase/collections";
import { redirect, type Actions } from "@sveltejs/kit";
import { getDocs, query, where } from "firebase/firestore";

export const actions: Actions = {
    passwordResetRequest: async ({ request, locals }) => {
        if (locals.user) return redirect(302, "/");

        const formData = await request.formData();
        const email = formData.get("email") as string;

        // Check if email exists
        const userQuery = query(USERS, where("email", "==", email));
        const existingUsers = (await getDocs(userQuery)).docs;

        if (existingUsers.length === 0)
            return { error: true, message: "Account non trovato" };

        if (existingUsers.length > 1)
            return {
                error: true,
                message: "Errore interno: più account trovati",
            };

        if (!existingUsers[0].data().email_verified)
            return { error: true, message: "Account non verificato" };

        if (!existingUsers[0].data().password_hash)
            return {
                error: true,
                message: "Account Google, impossibile resettare la password",
            };

        const resetToken = await generatePasswordResetToken(
            existingUsers[0].id
        );

        const { error, message } = await sendPasswordResetEmail(
            existingUsers[0].data().email,
            resetToken
        );
        if (error) return { error: true, message };
        else return redirect(302, "/");
    },
};
