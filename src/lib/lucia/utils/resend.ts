import { RESEND_API_KEY } from "$env/static/private";
import { Resend } from "resend";

const resend = new Resend(RESEND_API_KEY);

export async function sendEmail(
	email: string,
	subject: string,
	htmlContent: string
): Promise<{ error: boolean; message: string }> {
	const {error} = await resend.emails.send({
		from: 'Festa di Primavera <no-reply@festa-cus.it>',
		to: email,
		subject: subject,
		html: htmlContent
	});

	

	if (error) {
		console.error({ error });
		return { error: true, message: 'Failed to send email verification code.' };
	}

	return { error: false, message: 'Email verification code sent successfully.' };
}