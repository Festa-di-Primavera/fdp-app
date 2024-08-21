import { redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";
import { generateEmailVerificationCode, sendVerificationCode, verifyEmailVerificationCode } from "$lib/lucia/utils/email";

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) 
		redirect(302, "/login");

	if (locals.user.email_verified)
		redirect(302, '/');

	return locals.user;
};

export const actions: Actions = {
	resend: async ({locals}) => {
		console.log("resend");
		if (!locals.user)
			return redirect(302, "/login");

		// Send verification email
		const verificationCode = await generateEmailVerificationCode(locals.user.id, locals.user.email);
		await sendVerificationCode(locals.user?.email, verificationCode);
	},
	verify: async ({request, locals}) => {
		if (!locals.user)
			return redirect(302, "/login");

		const formData = await request.formData();
		const code = formData.get('code') as string;
		if(code.length !== 6)
			return {error: true, message: 'Codice non valido'};

		const {error, message} = await verifyEmailVerificationCode(locals.user.id, code);
		if (error)
			return {error: true, message};
		else
			return redirect(302, '/');
	}
}