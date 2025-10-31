import { RESEND_API_KEY } from "$env/static/private";
import { Resend, type Attachment } from "resend";
import { DOMAIN } from "./domain";

const resend = new Resend(RESEND_API_KEY);

export async function sendEmail(
    email: string,
    subject: string,
    htmlContent: string,
    options?: { senderName?: string; attachments?: Attachment[] },
): Promise<{ error: boolean; message: string; data?: any }> {
    try {
        const mappedAttachments = options?.attachments?.map(att => ({
            ...att,
            content: att.content instanceof Buffer ? att.content.toString('base64') : att.content
        }));

        const { data, error } = await resend.emails.send({
            from: `${options?.senderName ?? "Festa di Primavera"} <info@${DOMAIN}>`,
            to: email,
            subject: subject,
            html: htmlContent,
            attachments: mappedAttachments
        });

        if (error) {
            console.error(`[RESEND] Error sending to ${email}:`, error);
            return {
                error: true,
                message: `Failed to send email: ${error.message}`,
                data: error
            };
        }

        console.log(`[RESEND] Successfully sent to ${email}. ID: ${data?.id}`);
        return {
            error: false,
            message: "Email sent successfully",
            data
        };
    } catch (e) {
        console.error(`[RESEND] Exception while sending to ${email}:`, e);
        return {
            error: true,
            message: `Exception while sending email: ${e instanceof Error ? e.message : 'Unknown error'}`,
            data: e
        };
    }
}
