import { RESEND_API_KEY } from "$env/static/private";
import { Resend, type Attachment } from "resend";

const resend = new Resend(RESEND_API_KEY);

export async function sendEmail(
    email: string,
    subject: string,
    htmlContent: string,
    attachments?: Attachment[],
    senderName?: string
): Promise<{ error: boolean; message: string; data?: any }> {
    console.log(`[EMAIL] Attempting to send email to ${email}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Attachments: ${attachments?.length ?? 0}`);

    console.log(attachments)

    try {
        const { data, error } = await resend.emails.send({
            from: `${senderName ?? "Festa di Primavera"} <info@festa-cus.it>`,
            to: email,
            subject: subject,
            html: htmlContent,
            attachments: attachments
        });

        if (error) {
            console.error(`[EMAIL] Error sending to ${email}:`, error);
            return {
                error: true,
                message: `Failed to send email: ${error.message}`,
                data: error
            };
        }

        console.log(`[EMAIL] Successfully sent to ${email}. ID: ${data?.id}`);
        return {
            error: false,
            message: "Email sent successfully",
            data
        };
    } catch (e) {
        console.error(`[EMAIL] Exception while sending to ${email}:`, e);
        return {
            error: true,
            message: `Exception while sending email: ${e instanceof Error ? e.message : 'Unknown error'}`,
            data: e
        };
    }
}
