import { fail } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";
import { verifyPasswordResetToken } from "$lib/lucia/utils/password";

export const load: PageServerLoad = (async (event) => {

	const passwordResetToken = event.url.searchParams.get('token') as string;

	if (!passwordResetToken) {
		fail(400, {
			error: true,
			message: 'Invalid password reset token'
		});
	}

	const { success, message } = await verifyPasswordResetToken(passwordResetToken);

	return {
		passwordResetTokenStatus: {
			isValid: success,
			message
		},

		passwordResetFormData: await superValidate(PasswordResetZodSchema)
	};
})